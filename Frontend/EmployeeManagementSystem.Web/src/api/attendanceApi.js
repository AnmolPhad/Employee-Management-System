import axiosClient from './axiosClient';

export const attendanceApi = {
  checkIn: async (data = {}) => {
    return await axiosClient.post('/api/attendance/check-in', data);
  },

  checkOut: async (data = {}) => {
    return await axiosClient.post('/api/attendance/check-out', data);
  },

  getMyAttendance: async (params) => {
    return await axiosClient.get('/api/attendance/me', { params });
  },

  getMyAttendanceById: async (id) => {
    return await axiosClient.get(`/api/attendance/me/${id}`);
  },

  getAllAttendanceAdmin: async (params) => {
    return await axiosClient.get('/api/admin/attendance', { params });
  },

  getAttendanceByIdAdmin: async (id) => {
    return await axiosClient.get(`/api/admin/attendance/${id}`);
  },
};

export default attendanceApi;
