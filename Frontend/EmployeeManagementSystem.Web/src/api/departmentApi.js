import axiosClient from './axiosClient';

export const departmentApi = {
  getDepartments: async (params) => {
    return await axiosClient.get('/api/admin/departments', { params });
  },

  getDepartment: async (id) => {
    return await axiosClient.get(`/api/admin/departments/${id}`);
  },

  getDepartmentById: async (id) => {
    return await axiosClient.get(`/api/admin/departments/${id}`);
  },

  createDepartment: async (data) => {
    return await axiosClient.post('/api/admin/departments', data);
  },

  updateDepartment: async (id, data) => {
    return await axiosClient.put(`/api/admin/departments/${id}`, data);
  },

  deleteDepartment: async (id) => {
    return await axiosClient.delete(`/api/admin/departments/${id}`);
  },
};

export default departmentApi;
