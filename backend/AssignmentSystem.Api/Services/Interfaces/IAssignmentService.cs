using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface IAssignmentService
{
    Task<List<AssignmentDto>> GetAssignmentsForUserAsync(User currentUserId);
    Task<AssignmentDto> GetAssignmentByIdAsync(int id, User currentUser);
    Task<AssignmentDto> CreateAssignmentAsync(CreateAssignmentDto dto, int teacherId);
    Task<AssignmentDto> UpdateAssignmentAsync(int id, UpdateAssignmentDto dto, int teacherId);
    Task DeleteAssignmentAsync(int id, User currentUser);
}
