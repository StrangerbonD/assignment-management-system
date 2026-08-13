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
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissionService;

    public SubmissionsController(ISubmissionService submissionService)
    {
        _submissionService = submissionService;
    }

    /// <summary>
    /// List submissions (Student: own submissions; Teacher: submissions for assigned subjects; Admin: all)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<SubmissionDto>>> GetSubmissions([FromQuery] int? assignmentId)
    {
        var currentUser = GetCurrentUserFromClaims();
        if (assignmentId.HasValue)
        {
            var subs = await _submissionService.GetSubmissionsForAssignmentAsync(assignmentId.Value, currentUser);
            return Ok(subs);
        }
        var submissions = await _submissionService.GetSubmissionsForUserAsync(currentUser);
        return Ok(submissions);
    }

    /// <summary>
    /// List submissions for a specific assignment
    /// </summary>
    [HttpGet("assignment/{assignmentId}")]
    public async Task<ActionResult<List<SubmissionDto>>> GetSubmissionsForAssignment(int assignmentId)
    {
        var currentUser = GetCurrentUserFromClaims();
        var submissions = await _submissionService.GetSubmissionsForAssignmentAsync(assignmentId, currentUser);
        return Ok(submissions);
    }

    /// <summary>
    /// Get single submission by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SubmissionDto>> GetSubmissionById(int id)
    {
        var currentUser = GetCurrentUserFromClaims();
        var submission = await _submissionService.GetSubmissionByIdAsync(id, currentUser);
        return Ok(submission);
    }

    /// <summary>
    /// Create submission for an assignment (Student only; deadline & class scope enforced)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<ActionResult<SubmissionDto>> CreateSubmission([FromBody] CreateSubmissionDto dto)
    {
        var currentUser = GetCurrentUserFromClaims();
        var created = await _submissionService.CreateSubmissionAsync(dto, currentUser);
        return CreatedAtAction(nameof(GetSubmissionById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Update/resubmit submission before deadline (Student only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<ActionResult<SubmissionDto>> UpdateSubmission(int id, [FromBody] UpdateSubmissionDto dto)
    {
        var currentUser = GetCurrentUserFromClaims();
        var updated = await _submissionService.UpdateSubmissionAsync(id, dto, currentUser);
        return Ok(updated);
    }

    /// <summary>
    /// Grade submission with Marks & Feedback (Teacher only; subject ownership & Marks <= MaxMarks enforced)
    /// </summary>
    [HttpPost("{id}/grade")]
    [Authorize(Roles = nameof(UserRole.Teacher))]
    public async Task<ActionResult<SubmissionDto>> GradeSubmission(int id, [FromBody] GradeSubmissionDto dto)
    {
        var currentUser = GetCurrentUserFromClaims();
        var graded = await _submissionService.GradeSubmissionAsync(id, dto, currentUser);
        return Ok(graded);
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
