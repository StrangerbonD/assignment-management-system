using System.Net;
using System.Text.Json;
using AssignmentSystem.Api.Exceptions;

namespace AssignmentSystem.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred processing request {Method} {Path}", context.Request.Method, context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = HttpStatusCode.InternalServerError;
        var message = "An internal server error occurred.";

        switch (exception)
        {
            case BusinessRuleException bre:
                statusCode = HttpStatusCode.BadRequest;
                message = bre.Message;
                break;
            case NotFoundException nfe:
                statusCode = HttpStatusCode.NotFound;
                message = nfe.Message;
                break;
            case ConflictException ce:
                statusCode = HttpStatusCode.Conflict;
                message = ce.Message;
                break;
            case UnauthorizedAccessException uae:
                statusCode = HttpStatusCode.Forbidden;
                message = uae.Message;
                break;
            default:
                break;
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var result = JsonSerializer.Serialize(new
        {
            status = (int)statusCode,
            message
        });

        return context.Response.WriteAsync(result);
    }
}
