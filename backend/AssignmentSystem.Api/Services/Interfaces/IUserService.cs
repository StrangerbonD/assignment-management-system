using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Enums;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface IUserService
{
    Task<List<UserDto>> GetAllUsersAsync(UserRole? roleFilter = null, int? classIdFilter = null);
    Task<UserDto> GetUserByIdAsync(int id);
    Task<UserDto> CreateUserAsync(CreateUserDto dto);
    Task<UserDto> RegisterStudentAsync(RegisterStudentDto dto);
    Task<UserDto> ApproveUserAsync(int id);
    Task<UserDto> ResetPasswordAsync(int id, string newPassword);
    Task<UserDto> UpdateUserAsync(int id, UpdateUserDto dto);
    Task DeleteUserAsync(int id);
}
