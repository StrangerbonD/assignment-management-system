using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnrollmentsController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;

    public EnrollmentsController(IEnrollmentService enrollmentService)
    {
        _enrollmentService = enrollmentService;
    }

    private int GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID claim missing from authorization token.");
        }
        return userId;
    }

    // POST /api/enrollments/request - Student applies for a backlog/retake course
    [HttpPost("request")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<EnrollmentDto>> RequestEnrollment([FromBody] RequestEnrollmentDto dto)
    {
        var studentId = GetCurrentUserId();
        var result = await _enrollmentService.RequestEnrollmentAsync(studentId, dto.SubjectId);
        return Ok(result);
    }

    // GET /api/enrollments/my - Student views their retake course requests & approvals
    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetMyEnrollments()
    {
        var studentId = GetCurrentUserId();
        var result = await _enrollmentService.GetStudentEnrollmentsAsync(studentId);
        return Ok(result);
    }

    // GET /api/enrollments/teacher-pending - Teacher views pending retake requests for their courses
    [HttpGet("teacher-pending")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<List<EnrollmentDto>>> GetTeacherPendingEnrollments()
    {
        var teacherId = GetCurrentUserId();
        var result = await _enrollmentService.GetTeacherPendingEnrollmentsAsync(teacherId);
        return Ok(result);
    }

    // PUT /api/enrollments/{id}/approve - Teacher approves student retake request
    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<EnrollmentDto>> ApproveEnrollment(int id)
    {
        var teacherId = GetCurrentUserId();
        var result = await _enrollmentService.ApproveEnrollmentAsync(teacherId, id);
        return Ok(result);
    }

    // DELETE /api/enrollments/{id} - Teacher rejects student retake request
    [HttpDelete("{id}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> RejectEnrollment(int id)
    {
        var teacherId = GetCurrentUserId();
        await _enrollmentService.RejectEnrollmentAsync(teacherId, id);
        return NoContent();
    }
}
