using System.Net;
using System.Net.Http.Json;
using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Domain.Constants;
using Xunit;

namespace HRMS.Tests;

public class AuthAndPermissionTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public AuthAndPermissionTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Login_With_Invalid_Credentials_Returns_Unauthorized()
    {
        var request = new LoginRequest
        {
            Email = "invalid@hrms.com",
            Password = "WrongPassword123"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        Assert.NotNull(result);
        Assert.False(result.Success);
    }

    [Fact]
    public async Task Login_With_Valid_Admin_Returns_Token_And_All_Permissions()
    {
        var request = new LoginRequest
        {
            Email = "admin@hrms.com",
            Password = "Admin@123"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.NotEmpty(result.Data.AccessToken);
        Assert.Contains(Roles.SuperAdmin, result.Data.User.Roles);
        Assert.Contains(Permissions.EmployeeCreate, result.Data.User.Permissions);
        Assert.Contains(Permissions.PayrollGenerate, result.Data.User.Permissions);
    }

    [Fact]
    public async Task Login_With_Employee_Has_Limited_SelfService_Permissions()
    {
        var request = new LoginRequest
        {
            Email = "employee@hrms.com",
            Password = "Employee@123"
        };

        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", request);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Contains(Roles.Employee, result.Data!.User.Roles);
        Assert.Contains(Permissions.LeaveApply, result.Data.User.Permissions);
        Assert.Contains(Permissions.AttendanceCheckIn, result.Data.User.Permissions);
        // Employee should NOT have admin permissions
        Assert.DoesNotContain(Permissions.EmployeeDelete, result.Data.User.Permissions);
        Assert.DoesNotContain(Permissions.PayrollGenerate, result.Data.User.Permissions);
    }

    [Fact]
    public async Task Access_Protected_Endpoint_Without_Token_Returns_Unauthorized()
    {
        var response = await _client.GetAsync("/api/v1/employees");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
