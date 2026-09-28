using System.Net;
using System.Text.Json;
using HRMS.Application.Common;

namespace HRMS.API.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
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
            _logger.LogError(ex, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, response) = exception switch
        {
            NotFoundException notFound => ((int)HttpStatusCode.NotFound, ApiResponse.Fail(notFound.Message)),
            ValidationException val => ((int)HttpStatusCode.BadRequest, ApiResponse.Fail("Validation failed", val.Errors)),
            UnauthorizedException unauth => ((int)HttpStatusCode.Forbidden, ApiResponse.Fail(unauth.Message)),
            ConflictException conflict => ((int)HttpStatusCode.Conflict, ApiResponse.Fail(conflict.Message)),
            _ => ((int)HttpStatusCode.InternalServerError, ApiResponse.Fail("An internal server error occurred."))
        };

        context.Response.StatusCode = statusCode;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
