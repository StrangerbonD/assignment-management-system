using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Enums;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// List all users (Admin only)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<UserDto>>> GetAllUsers([FromQuery] UserRole? role, [FromQuery] int? classId)
    {
        var users = await _userService.GetAllUsersAsync(role, classId);
        return Ok(users);
    }

    /// <summary>
    /// Get single user by ID (Admin only)
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUserById(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        return Ok(user);
    }

    /// <summary>
    /// Create new user (Admin only)
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserDto dto)
    {
        var user = await _userService.CreateUserAsync(dto);
        return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, user);
    }

    /// <summary>
    /// Approve pending user registration (Admin only)
    /// </summary>
    [HttpPut("{id}/approve")]
    public async Task<ActionResult<UserDto>> ApproveUser(int id)
    {
        var user = await _userService.ApproveUserAsync(id);
        return Ok(user);
    }

    /// <summary>
    /// Reset user password (Admin only)
    /// </summary>
    [HttpPut("{id}/reset-password")]
    public async Task<ActionResult<UserDto>> ResetPassword(int id, [FromBody] ResetPasswordDto dto)
    {
        var user = await _userService.ResetPasswordAsync(id, dto.NewPassword);
        return Ok(user);
    }

    /// <summary>
    /// Update existing user (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> UpdateUser(int id, [FromBody] UpdateUserDto dto)
    {
        var user = await _userService.UpdateUserAsync(id, dto);
        return Ok(user);
    }

    /// <summary>
    /// Delete user (Admin only, rejects with 409 Conflict if active dependencies exist)
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        await _userService.DeleteUserAsync(id);
        return NoContent();
    }
}
