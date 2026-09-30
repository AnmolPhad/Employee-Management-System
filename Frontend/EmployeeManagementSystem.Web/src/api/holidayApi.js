import axiosClient from './axiosClient';

const holidayApi = {
  /**
   * Retrieves paginated holidays with optional filtering.
   * @param {Object} params - Query parameters (page, pageSize, year, isActive, search)
   */
  getHolidays: async (params = {}) => {
    return await axiosClient.get('/api/admin/holidays', { params });
  },

  /**
   * Retrieves a single holiday by ID.
   * @param {number|string} id - Holiday ID
   */
  getHolidayById: async (id) => {
    return await axiosClient.get(`/api/admin/holidays/${id}`);
  },

  /**
   * Creates a new organizational holiday (Admin & HR only).
   * @param {Object} payload - { holidayName, holidayDate, description, isActive }
   */
  createHoliday: async (payload) => {
    return await axiosClient.post('/api/admin/holidays', payload);
  },

  /**
   * Updates an existing holiday by ID (Admin & HR only).
   * @param {number|string} id - Holiday ID
   * @param {Object} payload - { holidayName, holidayDate, description, isActive }
   */
  updateHoliday: async (id, payload) => {
    return await axiosClient.put(`/api/admin/holidays/${id}`, payload);
  },

  /**
   * Deletes a holiday by ID (Admin & HR only).
   * @param {number|string} id - Holiday ID
   */
  deleteHoliday: async (id) => {
    return await axiosClient.delete(`/api/admin/holidays/${id}`);
  },
};

export default holidayApi;
