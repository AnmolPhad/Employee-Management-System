namespace EmployeeManagementSystem.API.Services
{
    public enum ServiceResultStatus
    {
        Success,
        NotFound,
        BadRequest,
        Conflict,
        InternalError
    }

    public class ServiceResult<T>
    {
        public ServiceResultStatus Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }

        public bool Succeeded => Status == ServiceResultStatus.Success;

        public static ServiceResult<T> Success(T data, string message)
        {
            return new ServiceResult<T> { Status = ServiceResultStatus.Success, Message = message, Data = data };
        }

        public static ServiceResult<T> NotFound(string message)
        {
            return new ServiceResult<T> { Status = ServiceResultStatus.NotFound, Message = message };
        }

        public static ServiceResult<T> BadRequest(string message)
        {
            return new ServiceResult<T> { Status = ServiceResultStatus.BadRequest, Message = message };
        }

        public static ServiceResult<T> Conflict(string message)
        {
            return new ServiceResult<T> { Status = ServiceResultStatus.Conflict, Message = message };
        }

        public static ServiceResult<T> InternalError(string message)
        {
            return new ServiceResult<T> { Status = ServiceResultStatus.InternalError, Message = message };
        }
    }
}
