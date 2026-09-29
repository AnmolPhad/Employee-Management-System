import axiosClient from './axiosClient';

export const authApi = {
  login: async (credentials) => {
    // credentials: { email, password }
    return await axiosClient.post('/api/auth/login', credentials);
  },

  getMe: async () => {
    return await axiosClient.get('/api/auth/me');
  },
};

export default authApi;
