using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Exceptions;
using AssignmentSystem.Api.Services.Interfaces;

namespace AssignmentSystem.Api.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new BusinessRuleException("Invalid email or password.");
        }

        if (!user.IsApproved)
        {
            throw new BusinessRuleException("Your account registration is currently pending Admin approval. Please wait for verification by the CSE Department Administrator.");
        }

        var token = GenerateJwtToken(user);

        return new AuthResponseDto(
            Token: token,
            Id: user.Id,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role,
            ClassId: user.ClassId,
            ClassName: user.Class?.Name
        );
    }

    public async Task<UserProfileDto> GetUserProfileAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new NotFoundException("User not found.");
        }

        return new UserProfileDto(
            Id: user.Id,
            FullName: user.FullName,
            Email: user.Email,
            Role: user.Role,
            ClassId: user.ClassId,
            ClassName: user.Class?.Name
        );
    }

    private string GenerateJwtToken(Entities.User user)
    {
        var secret = _configuration["Jwt:SecretKey"] ?? "DefaultSuperSecretKeyForAssignmentSystem123456!";
        var issuer = _configuration["Jwt:Issuer"] ?? "AssignmentSystemApi";
        var audience = _configuration["Jwt:Audience"] ?? "AssignmentSystemClients";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.ClassId.HasValue)
        {
            claims.Add(new Claim("ClassId", user.ClassId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
