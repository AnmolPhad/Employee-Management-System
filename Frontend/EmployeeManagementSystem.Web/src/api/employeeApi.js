import axiosClient from './axiosClient';

export const employeeApi = {
  getEmployees: async (params) => {
    return await axiosClient.get('/api/admin/employees', { params });
  },

  getEmployeeById: async (id) => {
    return await axiosClient.get(`/api/employees/${id}`);
  },

  createEmployee: async (data) => {
    return await axiosClient.post('/api/admin/employees', data);
  },

  updateEmployee: async (id, data) => {
    return await axiosClient.put(`/api/admin/employees/${id}`, data);
  },

  updatePersonalDetails: async (id, data) => {
    return await axiosClient.put(`/api/employees/${id}/personal`, data);
  },

  deleteEmployee: async (id) => {
    return await axiosClient.delete(`/api/admin/employees/${id}`);
  },

  getMyProfile: async () => {
    return await axiosClient.get('/api/employees/me');
  },
};

export default employeeApi;
