using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    public AssignmentsController(IAssignmentService assignmentService)
    {
        _assignmentService = assignmentService;
    }

    /// <summary>
    /// List assignments based on role context (Student: Published only for own ClassId; Teacher: Assigned subjects; Admin: All)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<AssignmentDto>>> GetAssignments()
    {
        var currentUser = GetCurrentUserFromClaims();
        var assignments = await _assignmentService.GetAssignmentsForUserAsync(currentUser);
        return Ok(assignments);
    }

    /// <summary>
    /// Get assignment details by ID with resource-level permission validation
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<AssignmentDto>> GetAssignmentById(int id)
    {
        var currentUser = GetCurrentUserFromClaims();
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
        var currentUser = GetCurrentUserFromClaims();
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
        var currentUser = GetCurrentUserFromClaims();
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
        var currentUser = GetCurrentUserFromClaims();
        await _assignmentService.DeleteAssignmentAsync(id, currentUser);
        return NoContent();
    }

    private User GetCurrentUserFromClaims()
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
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
