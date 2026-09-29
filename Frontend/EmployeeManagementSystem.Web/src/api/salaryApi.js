import axiosClient from './axiosClient';

export const salaryApi = {
  getMySalary: async () => {
    return await axiosClient.get('/api/salary/me');
  },

  getSalariesAdmin: async (params) => {
    return await axiosClient.get('/api/admin/salaries', { params });
  },

  getSalaryByIdAdmin: async (id) => {
    return await axiosClient.get(`/api/admin/salaries/${id}`);
  },

  getSalaryHistoryAdmin: async (employeeId) => {
    return await axiosClient.get(`/api/admin/salaries/history/${employeeId}`);
  },

  createSalaryAdmin: async (data) => {
    return await axiosClient.post('/api/admin/salaries', data);
  },

  updateSalaryAdmin: async (id, data) => {
    return await axiosClient.put(`/api/admin/salaries/${id}`, data);
  },

  incrementSalaryAdmin: async (id, data) => {
    return await axiosClient.post(`/api/admin/salaries/${id}/increment`, data);
  },

  deleteSalaryAdmin: async (id) => {
    return await axiosClient.delete(`/api/admin/salaries/${id}`);
  },

  calculateMonthlySalaryAdmin: async (employeeId, month) => {
    return await axiosClient.get(`/api/admin/salaries/calculate/${employeeId}`, { params: { month } });
  },

  getSettingsAdmin: async () => {
    return await axiosClient.get('/api/admin/salaries/settings');
  },

  updateSettingsAdmin: async (data) => {
    return await axiosClient.put('/api/admin/salaries/settings', data);
  },
};

export default salaryApi;
