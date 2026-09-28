namespace HRMS.Application.DTOs;

public class DesignationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Level { get; set; }
    public string? Description { get; set; }
    public int EmployeeCount { get; set; }
    public bool IsActive { get; set; }
}

public class CreateDesignationRequest
{
    public string Title { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public string? Description { get; set; }
}

public class UpdateDesignationRequest
{
    public string Title { get; set; } = string.Empty;
    public int Level { get; set; }
    public string? Description { get; set; }
}
