using System.Text;
using EmployeeManagementSystem.API.Authorization;
using EmployeeManagementSystem.API.Data;
using EmployeeManagementSystem.API.Middleware;
using EmployeeManagementSystem.API.Models;
using EmployeeManagementSystem.API.Services.Implementations;
using EmployeeManagementSystem.API.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// =========================================================================
// 1. Database Configuration (SQL Server)
// =========================================================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// =========================================================================
// 2. Identity Configuration
// =========================================================================
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// =========================================================================
// 3. JWT Authentication Configuration
// =========================================================================
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Key"]
    ?? throw new InvalidOperationException("JWT Key is not configured in appsettings.json.");
var key = Encoding.UTF8.GetBytes(secretKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ClockSkew = TimeSpan.Zero
    };
});

// =========================================================================
// 4. Authorization Configuration
// =========================================================================
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AppPolicies.EmployeeRead, policy =>
        policy.RequireRole(AppRoles.Admin, AppRoles.HR, AppRoles.Manager, AppRoles.Employee));

    options.AddPolicy(AppPolicies.EmployeeCreate, policy =>
        policy.RequireRole(AppRoles.Admin, AppRoles.HR));

    options.AddPolicy(AppPolicies.EmployeeUpdate, policy =>
        policy.RequireRole(AppRoles.Admin, AppRoles.HR));

    options.AddPolicy(AppPolicies.EmployeeDelete, policy =>
        policy.RequireRole(AppRoles.Admin));
});

// =========================================================================
// 5. CORS Configuration (Named Policy: ReactFrontend)
// =========================================================================
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// =========================================================================
// 6. Controllers & JSON Options
// =========================================================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// =========================================================================
// 7. Application Services
// =========================================================================
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// =========================================================================
// 8. Swagger / OpenAPI Configuration
// =========================================================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Employee Management System API",
        Version = "v1",
        Description = "ASP.NET Core Web API backend for Employee Management System React Frontend"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token into the text box below (e.g. 'Bearer {token}')"
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

// =========================================================================
// Identity Role Seeding
// =========================================================================
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    foreach (var roleName in AppRoles.All)
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }
}

// =========================================================================
// 9. HTTP Pipeline Configuration
// =========================================================================
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Employee Management System API v1");
        c.RoutePrefix = string.Empty; // Serve Swagger at root ("/") for direct access
    });
}

app.UseHttpsRedirection();

app.UseCors("ReactFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
