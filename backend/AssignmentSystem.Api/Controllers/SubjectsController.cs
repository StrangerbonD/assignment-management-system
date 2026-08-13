using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SubjectsController : ControllerBase
{
    private readonly IClassSubjectService _classSubjectService;

    public SubjectsController(IClassSubjectService classSubjectService)
    {
        _classSubjectService = classSubjectService;
    }

    /// <summary>
    /// Get all subjects, with optional filtering by Class ID
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<SubjectDto>>> GetAllSubjects([FromQuery] int? classId)
    {
        var subjects = await _classSubjectService.GetAllSubjectsAsync(classId);
        return Ok(subjects);
    }

    /// <summary>
    /// Get single subject by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SubjectDto>> GetSubjectById(int id)
    {
        var subject = await _classSubjectService.GetSubjectByIdAsync(id);
        return Ok(subject);
    }

    /// <summary>
    /// Create subject for a class (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<SubjectDto>> CreateSubject([FromBody] CreateSubjectDto dto)
    {
        var created = await _classSubjectService.CreateSubjectAsync(dto);
        return CreatedAtAction(nameof(GetSubjectById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Delete subject (Admin only, rejects with 409 Conflict if active assignments or teachers linked)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteSubject(int id)
    {
        await _classSubjectService.DeleteSubjectAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Assign a teacher to a subject (Admin only)
    /// </summary>
    [HttpPost("assign-teacher")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<TeacherSubjectDto>> AssignTeacher([FromBody] AssignTeacherDto dto)
    {
        var result = await _classSubjectService.AssignTeacherToSubjectAsync(dto);
        return Ok(result);
    }

    /// <summary>
    /// Unassign a teacher from a subject (Admin only)
    /// </summary>
    [HttpDelete("unassign-teacher/{teacherSubjectId}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> UnassignTeacher(int teacherSubjectId)
    {
        await _classSubjectService.UnassignTeacherFromSubjectAsync(teacherSubjectId);
        return NoContent();
    }

    /// <summary>
    /// Get subjects assigned to a specific teacher
    /// </summary>
    [HttpGet("teacher/{teacherId}")]
    public async Task<ActionResult<List<TeacherSubjectDto>>> GetTeacherSubjects(int teacherId)
    {
        var list = await _classSubjectService.GetTeacherSubjectsAsync(teacherId);
        return Ok(list);
    }

    /// <summary>
    /// Get course marksheet and grade summary table for a subject
    /// </summary>
    [HttpGet("{id}/marksheet")]
    public async Task<ActionResult<CourseMarksheetDto>> GetCourseMarksheet(int id)
    {
        var marksheet = await _classSubjectService.GetCourseMarksheetAsync(id);
        return Ok(marksheet);
    }
}
