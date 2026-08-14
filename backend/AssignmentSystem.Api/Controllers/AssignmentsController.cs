using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;
    private readonly AppDbContext _context;

    public AssignmentsController(IAssignmentService assignmentService, AppDbContext context)
    {
        _assignmentService = assignmentService;
        _context = context;
    }

    /// <summary>
    /// List assignments based on role context (Student: Published only for own ClassId; Teacher: Assigned subjects; Admin: All)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AssignmentDto>>> GetAssignments()
    {
        var currentUser = await GetCurrentUserAsync();
        var assignments = await _assignmentService.GetAssignmentsForUserAsync(currentUser);
        return Ok(assignments);
    }

    /// <summary>
    /// Get assignment details by ID with resource-level permission validation
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AssignmentDto>> GetAssignmentById(int id)
    {
        var currentUser = await GetCurrentUserAsync();
        var assignment = await _assignmentService.GetAssignmentByIdAsync(id, currentUser);
        return Ok(assignment);
    }

    /// <summary>
    /// Create assignment (Teacher & Admin; subject check for Teacher)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = $"{nameof(UserRole.Teacher)},{nameof(UserRole.Admin)}")]
    public async Task<ActionResult<AssignmentDto>> CreateAssignment([FromBody] CreateAssignmentDto dto)
    {
        var currentUser = await GetCurrentUserAsync();
        var created = await _assignmentService.CreateAssignmentAsync(dto, currentUser.Id);
        return CreatedAtAction(nameof(GetAssignmentById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Update assignment details or status (Teacher & Admin; subject check for Teacher)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = $"{nameof(UserRole.Teacher)},{nameof(UserRole.Admin)}")]
    public async Task<ActionResult<AssignmentDto>> UpdateAssignment(int id, [FromBody] UpdateAssignmentDto dto)
    {
        var currentUser = await GetCurrentUserAsync();
        var updated = await _assignmentService.UpdateAssignmentAsync(id, dto, currentUser.Id);
        return Ok(updated);
    }

    /// <summary>
    /// Delete assignment (Teacher & Admin; subject ownership check for Teacher)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = $"{nameof(UserRole.Teacher)},{nameof(UserRole.Admin)}")]
    public async Task<IActionResult> DeleteAssignment(int id)
    {
        var currentUser = await GetCurrentUserAsync();
        await _assignmentService.DeleteAssignmentAsync(id, currentUser);
        return NoContent();
    }

    private async Task<User> GetCurrentUserAsync()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(idClaim, out var userId))
        {
            var dbUser = await _context.Users.Include(u => u.Class).FirstOrDefaultAsync(u => u.Id == userId);
            if (dbUser != null) return dbUser;
        }

        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        var classIdClaim = User.FindFirst("ClassId")?.Value;
        var id = int.TryParse(idClaim, out var parsedId) ? parsedId : 0;
        var role = Enum.TryParse<UserRole>(roleClaim, out var parsedRole) ? parsedRole : UserRole.Student;
        int? classId = int.TryParse(classIdClaim, out var parsedClassId) ? parsedClassId : null;

        return new User
        {
            Id = id,
            Role = role,
            ClassId = classId
        };
    }
}
