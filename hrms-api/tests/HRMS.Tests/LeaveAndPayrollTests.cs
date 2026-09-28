using System.Net.Http.Headers;
using System.Net.Http.Json;
using HRMS.Application.Common;
using HRMS.Application.DTOs;
using HRMS.Domain.Entities;
using Xunit;

namespace HRMS.Tests;

public class LeaveAndPayrollTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public LeaveAndPayrollTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public void SalaryStructure_Formulas_Calculate_Accurately()
    {
        var salary = new SalaryStructure
        {
            BasicSalary = 5000,
            HRA = 2000,
            DA = 500,
            MedicalAllowance = 300,
            ConveyanceAllowance = 200,
            SpecialAllowance = 1000,
            PF = 600,
            ESI = 100,
            ProfessionalTax = 50,
            TDS = 500
        };

        // Expected Gross = 5000 + 2000 + 500 + 300 + 200 + 1000 = 9000
        Assert.Equal(9000m, salary.GrossSalary);

        // Expected Deductions = 600 + 100 + 50 + 500 = 1250
        Assert.Equal(1250m, salary.TotalDeductions);

        // Expected Net = 9000 - 1250 = 7750
        Assert.Equal(7750m, salary.NetSalary);
    }

    [Fact]
    public async Task Employee_Can_Login_And_Query_Own_Balances()
    {
        // 1. Login as employee
        var loginRes = await _client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest
        {
            Email = "employee@hrms.com",
            Password = "Employee@123"
        });
        var auth = await loginRes.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>();
        Assert.NotNull(auth?.Data?.AccessToken);

        // 2. Query own leave balances
        var req = new HttpRequestMessage(HttpMethod.Get, "/api/v1/leaves/balances/my-balances?year=2026");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth.Data.AccessToken);

        var balanceRes = await _client.SendAsync(req);
        Assert.Equal(System.Net.HttpStatusCode.OK, balanceRes.StatusCode);

        var balances = await balanceRes.Content.ReadFromJsonAsync<ApiResponse<List<LeaveBalanceDto>>>();
        Assert.NotNull(balances?.Data);
        Assert.NotEmpty(balances.Data);
        Assert.All(balances.Data, b => Assert.True(b.RemainingLeaves > 0));
    }
}
