using AssignmentSystem.Api.Dtos;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<UserProfileDto> GetUserProfileAsync(int userId);
}
