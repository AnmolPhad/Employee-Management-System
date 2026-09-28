using System.Diagnostics;

namespace HRMS.API.Middlewares;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        var user = context.User.Identity?.IsAuthenticated == true ? context.User.Identity.Name : "Anonymous";
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        _logger.LogInformation("HTTP {Method} {Path} initiated by {User} from {IP}",
            context.Request.Method, context.Request.Path, user, ip);

        await _next(context);

        sw.Stop();
        _logger.LogInformation("HTTP {Method} {Path} responded {StatusCode} in {ElapsedMs}ms",
            context.Request.Method, context.Request.Path, context.Response.StatusCode, sw.ElapsedMilliseconds);
    }
}
