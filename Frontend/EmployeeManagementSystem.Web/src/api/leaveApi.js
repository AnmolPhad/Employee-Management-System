import axiosClient from './axiosClient';

export const leaveApi = {
  createLeave: async (data) => {
    return await axiosClient.post('/api/leaves', data);
  },

  applyLeave: async (data) => {
    return await axiosClient.post('/api/leaves', data);
  },

  getMyLeaves: async (params) => {
    return await axiosClient.get('/api/leaves/me', { params });
  },

  getMyLeaveById: async (id) => {
    return await axiosClient.get(`/api/leaves/me/${id}`);
  },

  getMyLeaveBalance: async (year) => {
    return await axiosClient.get('/api/leaves/me/balance', { params: { year } });
  },

  getActiveLeaveTypes: async () => {
    return await axiosClient.get('/api/leaves/types');
  },

  getPendingApprovals: async (params) => {
    return await axiosClient.get('/api/leaves/pending-approvals', { params });
  },

  getLeaveById: async (id) => {
    return await axiosClient.get(`/api/leaves/${id}`);
  },

  approveLeave: async (id) => {
    return await axiosClient.put(`/api/leaves/${id}/approve`);
  },

  rejectLeave: async (id, reason) => {
    return await axiosClient.put(`/api/leaves/${id}/reject`, { rejectionReason: reason });
  },

  getAllLeavesAdmin: async (params) => {
    return await axiosClient.get('/api/admin/leaves', { params });
  },
};

export default leaveApi;
