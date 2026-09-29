import axiosClient from './axiosClient';

export const ticketApi = {
  getMyTickets: async (params) => {
    return await axiosClient.get('/api/tickets/me', { params });
  },

  getMyTicketById: async (id) => {
    return await axiosClient.get(`/api/tickets/me/${id}`);
  },

  getMyApprovals: async (params) => {
    return await axiosClient.get('/api/tickets/my-approvals', { params });
  },

  getTicketById: async (id) => {
    return await axiosClient.get(`/api/tickets/${id}`);
  },

  approveTicket: async (id) => {
    return await axiosClient.put(`/api/tickets/${id}/approve`);
  },

  rejectTicket: async (id, reason) => {
    return await axiosClient.put(`/api/tickets/${id}/reject`, { reason });
  },

  getAllTicketsAdmin: async (params) => {
    return await axiosClient.get('/api/admin/tickets', { params });
  },

  getTicketByIdAdmin: async (id) => {
    return await axiosClient.get(`/api/admin/tickets/${id}`);
  },
};

export default ticketApi;
