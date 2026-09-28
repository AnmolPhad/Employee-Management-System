using HRMS.Domain.Common;
using HRMS.Domain.Enums;

namespace HRMS.Domain.Entities;

public class SalaryStructure : BaseEntity
{
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public decimal BasicSalary { get; set; }
    public decimal HRA { get; set; }
    public decimal DA { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal ConveyanceAllowance { get; set; }
    public decimal SpecialAllowance { get; set; }

    // Deductions
    public decimal PF { get; set; }
    public decimal ESI { get; set; }
    public decimal ProfessionalTax { get; set; }
    public decimal TDS { get; set; }

    public decimal GrossSalary => BasicSalary + HRA + DA + MedicalAllowance + ConveyanceAllowance + SpecialAllowance;
    public decimal TotalDeductions => PF + ESI + ProfessionalTax + TDS;
    public decimal NetSalary => GrossSalary - TotalDeductions;

    public DateTime EffectiveFrom { get; set; }
}

public class Payslip : BaseEntity
{
    public int EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;

    public int? SalaryStructureId { get; set; }
    public SalaryStructure? SalaryStructure { get; set; }

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

    public PayslipStatus Status { get; set; } = PayslipStatus.Generated;
    public DateTime GeneratedOn { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedOn { get; set; }
    public int? ApprovedById { get; set; }
}
