namespace HRMS.Domain.Constants;

public static class Roles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string HRManager = "HRManager";
    public const string Manager = "Manager";
    public const string Employee = "Employee";

    public static readonly string[] All = [SuperAdmin, HRManager, Manager, Employee];
}
