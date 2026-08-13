using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClassesController : ControllerBase
{
    private readonly IClassSubjectService _classSubjectService;

    public ClassesController(IClassSubjectService classSubjectService)
    {
        _classSubjectService = classSubjectService;
    }

    /// <summary>
    /// Get all classes (Accessible to all users and public registration)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<ClassDto>>> GetAllClasses()
    {
        var classes = await _classSubjectService.GetAllClassesAsync();
        return Ok(classes);
    }

    /// <summary>
    /// Get single class details by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<ClassDto>> GetClassById(int id)
    {
        var c = await _classSubjectService.GetClassByIdAsync(id);
        return Ok(c);
    }

    /// <summary>
    /// Create class (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<ClassDto>> CreateClass([FromBody] CreateClassDto dto)
    {
        var created = await _classSubjectService.CreateClassAsync(dto);
        return CreatedAtAction(nameof(GetClassById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Delete class (Admin only, rejects with 409 Conflict if associated students or subjects exist)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> DeleteClass(int id)
    {
        await _classSubjectService.DeleteClassAsync(id);
        return NoContent();
    }
}
