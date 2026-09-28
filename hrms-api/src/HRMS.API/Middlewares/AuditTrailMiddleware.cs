using System.Security.Claims;
using HRMS.Application.Interfaces;
using HRMS.Domain.Entities;

namespace HRMS.API.Middlewares;

public class AuditTrailMiddleware
{
    private readonly RequestDelegate _next;

    public AuditTrailMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IAuditService auditService)
    {
        await _next(context);

        // Only log state-changing operations
        var method = context.Request.Method;
        if (method is "POST" or "PUT" or "PATCH" or "DELETE")
        {
            var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var correlationId = context.Items["CorrelationId"]?.ToString();

            var audit = new AuditLog
            {
                UserId = userId,
                Action = method,
                Endpoint = context.Request.Path,
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                StatusCode = context.Response.StatusCode,
                Timestamp = DateTime.UtcNow,
                CorrelationId = correlationId
            };

            await auditService.LogAsync(audit);
        }
    }
}
