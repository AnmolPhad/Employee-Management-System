import axiosClient from './axiosClient';

export const leaveTypeApi = {
  getLeaveTypes: async (params) => {
    return await axiosClient.get('/api/admin/leave-types', { params });
  },

  getLeaveType: async (id) => {
    return await axiosClient.get(`/api/admin/leave-types/${id}`);
  },

  getLeaveTypeById: async (id) => {
    return await axiosClient.get(`/api/admin/leave-types/${id}`);
  },

  createLeaveType: async (data) => {
    return await axiosClient.post('/api/admin/leave-types', data);
  },

  updateLeaveType: async (id, data) => {
    return await axiosClient.put(`/api/admin/leave-types/${id}`, data);
  },

  deleteLeaveType: async (id) => {
    return await axiosClient.delete(`/api/admin/leave-types/${id}`);
  },
};

export default leaveTypeApi;
