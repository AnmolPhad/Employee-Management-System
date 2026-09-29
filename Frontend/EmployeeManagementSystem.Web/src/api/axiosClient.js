import axios from 'axios';
import { getStoredToken, clearAuth } from '../utils/auth';
import { ROUTES } from '../utils/constants';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5188';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format and handle errors globally
axiosClient.interceptors.response.use(
  (response) => {
    // Return standard backend ApiResponse { success, message, data }
    return response.data;
  },
  (error) => {
    const status = error.response ? error.response.status : null;
    const responseData = error.response ? error.response.data : null;

    let friendlyMessage = 'An unexpected error occurred. Please try again.';

    if (!error.response) {
      friendlyMessage = 'Unable to connect to server. Please check your internet connection or backend status.';
    } else {
      // Backend returns { success: false, message: "..." }
      if (responseData && typeof responseData === 'object' && responseData.message) {
        friendlyMessage = responseData.message;
      } else if (typeof responseData === 'string' && responseData.trim().length > 0) {
        friendlyMessage = responseData;
      } else {
        switch (status) {
          case 400:
            friendlyMessage = 'Please check the information provided and try again.';
            break;
          case 401:
            friendlyMessage = 'Your session has expired. Please log in again.';
            clearAuth();
            if (!window.location.pathname.includes(ROUTES.LOGIN)) {
              window.location.href = ROUTES.LOGIN;
            }
            break;
          case 403:
            friendlyMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            friendlyMessage = 'The requested resource was not found.';
            break;
          case 409:
            friendlyMessage = 'Operation conflicts with existing data.';
            break;
          case 500:
            friendlyMessage = 'Internal server error occurred. Please contact the administrator.';
            break;
          default:
            friendlyMessage = `Server returned error (${status}).`;
            break;
        }
      }
    }

    const enhancedError = new Error(friendlyMessage);
    enhancedError.status = status;
    enhancedError.originalData = responseData;
    enhancedError.rawError = error;

    return Promise.reject(enhancedError);
  }
);

export default axiosClient;
