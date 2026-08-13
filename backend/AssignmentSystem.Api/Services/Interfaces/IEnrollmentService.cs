using System.Collections.Generic;
using System.Threading.Tasks;
using AssignmentSystem.Api.Dtos;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface IEnrollmentService
{
    Task<EnrollmentDto> RequestEnrollmentAsync(int studentId, int subjectId);
    Task<List<EnrollmentDto>> GetStudentEnrollmentsAsync(int studentId);
    Task<List<EnrollmentDto>> GetTeacherPendingEnrollmentsAsync(int teacherId);
    Task<EnrollmentDto> ApproveEnrollmentAsync(int teacherId, int enrollmentId);
    Task RejectEnrollmentAsync(int teacherId, int enrollmentId);
}
