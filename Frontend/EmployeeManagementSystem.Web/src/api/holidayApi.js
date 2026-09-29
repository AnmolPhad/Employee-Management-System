import axiosClient from './axiosClient';

export const holidayApi = {
  getHolidays: async (params) => {
    return await axiosClient.get('/api/admin/holidays', { params });
  },

  getHolidayById: async (id) => {
    return await axiosClient.get(`/api/admin/holidays/${id}`);
  },

  createHoliday: async (data) => {
    return await axiosClient.post('/api/admin/holidays', data);
  },

  updateHoliday: async (id, data) => {
    return await axiosClient.put(`/api/admin/holidays/${id}`, data);
  },

  deleteHoliday: async (id) => {
    return await axiosClient.delete(`/api/admin/holidays/${id}`);
  },
};

export default holidayApi;
