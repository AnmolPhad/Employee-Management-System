using HRMS.Application.Interfaces;
using HRMS.Domain.Entities;
using HRMS.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace HRMS.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly HrmsDbContext _context;
    private readonly ILogger<AuditService> _logger;

    public AuditService(HrmsDbContext context, ILogger<AuditService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(AuditLog log)
    {
        try
        {
            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log to database.");
        }
    }
}

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendEmailAsync(string to, string subject, string bodyHtml)
    {
        _logger.LogInformation("[EMAIL SENT] To: {To} | Subject: {Subject} | Body: {Body}", to, subject, bodyHtml);
        return Task.CompletedTask;
    }

    public Task SendLeaveStatusNotificationAsync(string toEmail, string employeeName, string leaveType, string status, string? comments)
    {
        var body = $"Hello {employeeName},<br/>Your leave request for <b>{leaveType}</b> has been <b>{status}</b>.<br/>" +
                   $"{(string.IsNullOrWhiteSpace(comments) ? "" : $"Manager Comments: {comments}<br/>")}" +
                   "Regards,<br/>HR Team";
        return SendEmailAsync(toEmail, $"Leave Request {status}", body);
    }

    public Task SendPayslipGeneratedNotificationAsync(string toEmail, string employeeName, string monthYear, decimal netPay)
    {
        var body = $"Hello {employeeName},<br/>Your payslip for <b>{monthYear}</b> has been generated.<br/>" +
                   $"Net Payable: <b>${netPay:N2}</b>.<br/>You can download it from the HRMS portal.<br/>" +
                   "Regards,<br/>Finance Team";
        return SendEmailAsync(toEmail, $"Payslip Available: {monthYear}", body);
    }

    public Task SendReviewNotificationAsync(string toEmail, string employeeName, string reviewPeriod, string message)
    {
        var body = $"Hello {employeeName},<br/>Notification regarding Performance Review cycle <b>{reviewPeriod}</b>:<br/>" +
                   $"{message}<br/>" +
                   "Regards,<br/>HR Performance Management";
        return SendEmailAsync(toEmail, $"Performance Review Update: {reviewPeriod}", body);
    }
}
