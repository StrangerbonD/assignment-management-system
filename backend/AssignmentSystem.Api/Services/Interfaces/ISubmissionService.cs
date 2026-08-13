using AssignmentSystem.Api.Dtos;
using AssignmentSystem.Api.Entities;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface ISubmissionService
{
    Task<List<SubmissionDto>> GetSubmissionsForUserAsync(User currentUser);
    Task<List<SubmissionDto>> GetSubmissionsForAssignmentAsync(int assignmentId, User currentUser);
    Task<SubmissionDto> GetSubmissionByIdAsync(int id, User currentUser);
    Task<SubmissionDto> CreateSubmissionAsync(CreateSubmissionDto dto, User student);
    Task<SubmissionDto> UpdateSubmissionAsync(int id, UpdateSubmissionDto dto, User student);
    Task<SubmissionDto> GradeSubmissionAsync(int id, GradeSubmissionDto dto, User teacher);
}
