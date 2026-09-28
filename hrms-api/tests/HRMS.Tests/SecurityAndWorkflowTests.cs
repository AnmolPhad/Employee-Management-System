using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Domain.Constants;
using Xunit;

namespace HRMS.Tests;

public class SecurityAndWorkflowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public SecurityAndWorkflowTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> GetTokenAsync(string email, string password)
    {
        var loginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            Email = email,
            Password = password
        });
        var auth = await loginRes.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        return auth!.Data!.AccessToken;
    }

    [Fact]
    public async Task Employee_Attempting_To_Create_Employee_Returns_Forbidden()
    {
        var employeeToken = await GetTokenAsync("employee@hrms.com", "Employee@123");

        var createReq = new CreateEmployeeRequest
        {
            FirstName = "Unauthorized",
            LastName = "User",
            Email = "hacker@hrms.com",
            Phone = "1234567890",
            DateOfBirth = DateTime.Today.AddYears(-25),
            Gender = "Other",
            DateOfJoining = DateTime.Today
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/employees")
        {
            Content = JsonContent.Create(createReq)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", employeeToken);

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Create_And_Soft_Delete_Employee()
    {
        var adminToken = await GetTokenAsync("admin@hrms.com", "Admin@123");

        // 1. Create Employee
        var createReq = new CreateEmployeeRequest
        {
            FirstName = "Test",
            LastName = "Employee",
            Email = $"test.emp.{Guid.NewGuid():N}@hrms.com",
            Phone = "+1-555-9999",
            DateOfBirth = new DateTime(1998, 5, 20),
            Gender = "Female",
            DateOfJoining = DateTime.Today
        };

        var postReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/employees")
        {
            Content = JsonContent.Create(createReq)
        };
        postReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var postRes = await _client.SendAsync(postReq);
        Assert.Equal(HttpStatusCode.Created, postRes.StatusCode);

        var created = await postRes.Content.ReadFromJsonAsync<ApiResponse<EmployeeDto>>();
        Assert.NotNull(created?.Data);
        var empId = created.Data.Id;

        // 2. Soft-Delete Employee
        var delReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/v1/employees/{empId}");
        delReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var delRes = await _client.SendAsync(delReq);
        Assert.Equal(HttpStatusCode.OK, delRes.StatusCode);

        // 3. Verify querying returns 404 due to EF soft-delete filter
        var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/employees/{empId}");
        getReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var getRes = await _client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.NotFound, getRes.StatusCode);
    }

    [Fact]
    public async Task Employee_Can_CheckIn_And_CheckOut()
    {
        var employeeToken = await GetTokenAsync("employee@hrms.com", "Employee@123");

        // Check In
        var inReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/attendance/check-in");
        inReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", employeeToken);

        var inRes = await _client.SendAsync(inReq);
        // Can be OK (first check-in) or BadRequest (already checked in for today)
        Assert.True(inRes.StatusCode is HttpStatusCode.OK or HttpStatusCode.BadRequest);

        // Check Out
        var outReq = new HttpRequestMessage(HttpMethod.Post, "/api/v1/attendance/check-out");
        outReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", employeeToken);

        var outRes = await _client.SendAsync(outReq);
        Assert.Equal(HttpStatusCode.OK, outRes.StatusCode);
    }
}
