import axiosClient from './axiosClient';

const attendanceApi = {
  /**
   * Records check-in punch for the currently authenticated employee.
   * @param {Object} data - Optional check-in parameters ({ time, date, remarks })
   */
  checkIn: async (data = {}) => {
    return await axiosClient.post('/api/attendance/check-in', data);
  },

  /**
   * Records check-out punch and calculates working hours for authenticated employee.
   * @param {Object} data - Optional check-out parameters ({ time, date, remarks })
   */
  checkOut: async (data = {}) => {
    return await axiosClient.post('/api/attendance/check-out', data);
  },

  /**
   * Retrieves paginated attendance records for authenticated employee.
   * @param {Object} params - Query parameters (page, pageSize, status, startDate, endDate, year, month)
   */
  getMyAttendance: async (params = {}) => {
    return await axiosClient.get('/api/attendance/me', { params });
  },

  /**
   * Retrieves a specific attendance record by ID for authenticated employee.
   * @param {number|string} id - Attendance ID
   */
  getMyAttendanceById: async (id) => {
    return await axiosClient.get(`/api/attendance/me/${id}`);
  },

  /**
   * Retrieves attendance records for management (Admin, HR, Manager).
   * @param {Object} params - Query parameters (page, pageSize, employeeId, status, startDate, endDate, year, month)
   */
  getAdminAttendance: async (params = {}) => {
    return await axiosClient.get('/api/admin/attendance', { params });
  },

  /**
   * Retrieves a specific attendance record by ID for management.
   * @param {number|string} id - Attendance ID
   */
  getAdminAttendanceById: async (id) => {
    return await axiosClient.get(`/api/admin/attendance/${id}`);
  },

  /**
   * Helper to fetch today's attendance for the authenticated employee.
   * Uses YYYY-MM-DD format to prevent timezone shifts.
   */
  getTodayAttendance: async (todayDateStr) => {
    let dateStr = todayDateStr;
    if (!dateStr) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }
    const res = await axiosClient.get('/api/attendance/me', {
      params: {
        startDate: dateStr,
        endDate: dateStr,
        page: 1,
        pageSize: 1,
      },
    });
    const items = res?.data?.items || res?.data || [];
    return items.length > 0 ? items[0] : null;
  },
};

export default attendanceApi;
