using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using HRMS.API.Authorization;
using HRMS.API.Middlewares;
using HRMS.API.Services;
using HRMS.Application.Common;
using HRMS.Application.Interfaces;
using HRMS.Application.Validators;
using HRMS.Infrastructure.Data;
using HRMS.Infrastructure.Seed;
using HRMS.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ── 1. Database Configuration ───────────────────────────────────────
var useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDatabase");
if (useInMemory)
{
    builder.Services.AddDbContext<HrmsDbContext>(options =>
        options.UseInMemoryDatabase("HrmsDb"));
}
else
{
    var connStr = builder.Configuration.GetConnectionString("DefaultConnection");
    builder.Services.AddDbContext<HrmsDbContext>(options =>
        options.UseSqlServer(connStr));
}

// ── 2. Dependency Injection (Services) ───────────────────────────────
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IDesignationService, DesignationService>();
builder.Services.AddScoped<ILeaveService, LeaveService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<IPayrollService, PayrollService>();
builder.Services.AddScoped<IPerformanceService, PerformanceService>();
builder.Services.AddScoped<IAuditService, AuditService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// ── 3. FluentValidation ──────────────────────────────────────────────
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

// ── 4. Authentication (JWT) ──────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:SecretKey"] ?? "HRMS_Super_Secret_Key_For_Jwt_Token_Generation_2026!#@_MustBeLongEnough";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "HRMS.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "HRMS.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.Zero,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// ── 5. Permission-based Authorization ────────────────────────────────
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();

// ── 6. Rate Limiting (6 Tiers) ────────────────────────────────────────
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Global limiter (IP-based fallback)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    // Auth endpoints (brute-force defense)
    options.AddPolicy("AuthPolicy", context =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(5),
                SegmentsPerWindow = 5,
                QueueLimit = 0
            }));

    // SuperAdmin policy
    options.AddPolicy("SuperAdminPolicy", context =>
        RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: context.User.Identity?.Name ?? "anon",
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 500,
                ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                TokensPerPeriod = 500,
                QueueLimit = 10
            }));

    // HRManager policy
    options.AddPolicy("HRManagerPolicy", context =>
        RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: context.User.Identity?.Name ?? "anon",
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 300,
                ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                TokensPerPeriod = 300,
                QueueLimit = 5
            }));

    // Standard user policy
    options.AddPolicy("StandardPolicy", context =>
        RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: context.User.Identity?.Name ?? "anon",
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 100,
                ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                TokensPerPeriod = 100,
                QueueLimit = 2
            }));

    // Payroll generation policy (expensive operation)
    options.AddPolicy("PayrollGeneratePolicy", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromHours(1),
                QueueLimit = 0
            }));

    // Structured 429 response
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = 429;
        context.HttpContext.Response.ContentType = "application/json";

        var response = ApiResponse.Fail("Too many requests. Please try again later.");

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
            response = ApiResponse.Fail($"Too many requests. Retry after {retryAfter.TotalSeconds} seconds.");
        }

        await context.HttpContext.Response.WriteAsJsonAsync(response, cancellationToken);
    };
});

// ── 7. CORS ──────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("HRMSPolicy", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
        if (origins.Length > 0)
        {
            policy.WithOrigins(origins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()
                  .WithExposedHeaders("X-Correlation-Id", "Retry-After");
        }
        else
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
        }
    });
});

builder.Services.AddControllers();

// ── 8. Swagger with Bearer Auth ──────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "HRMS REST API",
        Version = "v1",
        Description = "Enterprise Human Resource Management System REST API built with .NET 9"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── 9. Middleware Pipeline (Exact Execution Order) ───────────────────
// ① Correlation ID — First so every downstream log and response includes it
app.UseMiddleware<CorrelationIdMiddleware>();

// ② Global Exception Handler — Wraps the entire downstream pipeline
app.UseMiddleware<GlobalExceptionMiddleware>();

// ③ Rate Limiting — Before auth to block brute-force / DDoS attacks
app.UseRateLimiter();

// ④ Request / Response Logging
app.UseMiddleware<RequestLoggingMiddleware>();

// ⑤ CORS
app.UseCors("HRMSPolicy");

// ⑥ Authentication
app.UseAuthentication();

// ⑦ Authorization
app.UseAuthorization();

// ⑧ Audit Trail — After auth so user identity is available
app.UseMiddleware<AuditTrailMiddleware>();

// Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "HRMS REST API v1");
    c.RoutePrefix = string.Empty; // Serve Swagger UI at root ("/")
});

app.MapControllers();

// ── 10. Database Seeding on Startup ──────────────────────────────────
await DataSeeder.SeedAsync(app.Services);

app.Run();

// Needed for WebApplicationFactory in integration tests
public partial class Program { }
