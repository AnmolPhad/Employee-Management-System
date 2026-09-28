using HRMS.Domain.Enums;

namespace HRMS.Application.DTOs;

public class SalaryStructureDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public decimal BasicSalary { get; set; }
    public decimal HRA { get; set; }
    public decimal DA { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal ConveyanceAllowance { get; set; }
    public decimal SpecialAllowance { get; set; }
    public decimal PF { get; set; }
    public decimal ESI { get; set; }
    public decimal ProfessionalTax { get; set; }
    public decimal TDS { get; set; }
    public decimal GrossSalary { get; set; }
    public decimal TotalDeductions { get; set; }
    public decimal NetSalary { get; set; }
    public DateTime EffectiveFrom { get; set; }
}

public class CreateSalaryStructureRequest
{
    public int EmployeeId { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal HRA { get; set; }
    public decimal DA { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal ConveyanceAllowance { get; set; }
    public decimal SpecialAllowance { get; set; }
    public decimal PF { get; set; }
    public decimal ESI { get; set; }
    public decimal ProfessionalTax { get; set; }
    public decimal TDS { get; set; }
    public DateTime EffectiveFrom { get; set; }
}

public class PayslipDto
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public string EmployeeName { get; set; } = string.Empty;
    public string EmployeeCode { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string DesignationTitle { get; set; } = string.Empty;
    public int Month { get; set; }
    public int Year { get; set; }
    public int WorkingDays { get; set; }
    public int PresentDays { get; set; }
    public int LeaveDays { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal Allowances { get; set; }
    public decimal GrossPay { get; set; }
    public decimal Deductions { get; set; }
    public decimal NetPay { get; set; }
    public PayslipStatus Status { get; set; }
    public DateTime GeneratedOn { get; set; }
}

public class GeneratePayrollRequest
{
    public int Month { get; set; }
    public int Year { get; set; }
    public int? DepartmentId { get; set; }
}
