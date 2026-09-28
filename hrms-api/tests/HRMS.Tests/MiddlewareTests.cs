using System.Net;
using System.Net.Http.Json;
using HRMS.API.Middlewares;
using HRMS.Application.Common;
using Xunit;

namespace HRMS.Tests;

public class MiddlewareTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public MiddlewareTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Response_Contains_Correlation_Id_Header()
    {
        var response = await _client.GetAsync("/api/v1/auth/roles");
        Assert.True(response.Headers.Contains(CorrelationIdMiddleware.CorrelationIdHeader));

        var correlationId = response.Headers.GetValues(CorrelationIdMiddleware.CorrelationIdHeader).FirstOrDefault();
        Assert.False(string.IsNullOrWhiteSpace(correlationId));
    }

    [Fact]
    public async Task Preserves_Custom_Correlation_Id_Header_If_Supplied()
    {
        var customId = "custom-trace-id-998877";
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/auth/roles");
        request.Headers.Add(CorrelationIdMiddleware.CorrelationIdHeader, customId);

        var response = await _client.SendAsync(request);
        Assert.True(response.Headers.Contains(CorrelationIdMiddleware.CorrelationIdHeader));

        var returnedId = response.Headers.GetValues(CorrelationIdMiddleware.CorrelationIdHeader).FirstOrDefault();
        Assert.Equal(customId, returnedId);
    }
}
