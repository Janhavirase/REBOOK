// frontend/src/api/axios.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// 1. Create a centralized Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  // 🚨 CRITICAL: This tells the browser to always send our HTTP-Only Refresh Cookie
  withCredentials: true, 
});

// 2. REQUEST INTERCEPTOR: Automatically attach the Access Token to every request
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const { token } = JSON.parse(userInfo);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR: The "Silent Refresh" Engine
api.interceptors.response.use(
  (response) => response, // If the request succeeds normally, do nothing.
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 (Token Expired) AND we haven't already retried this exact request...
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried so we don't cause an infinite loop

      try {
        // Silently hit our new backend refresh route
        const { data } = await axios.get(`${API_BASE_URL}/api/users/refresh`, {
          withCredentials: true,
        });

        // The backend gave us a brand new 15-minute token. Update LocalStorage!
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userInfo.token = data.token;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        // Update the failed request's header with the NEW token
        originalRequest.headers.Authorization = `Bearer ${data.token}`;

        // Retry the original request seamlessly (the user won't even notice)
        return api(originalRequest);
        
      } catch (refreshError) {
        // If the refresh fails (e.g., Refresh Token expired OR a Hacker Reuse was detected)
        console.error('Session expired or compromised. Force logging out.');
        localStorage.removeItem('userInfo');
        window.location.href = '/login'; // Kick them back to the login screen
        return Promise.reject(refreshError);
      }
    }

    // If it's a 404, 500, etc., just pass the error back to the component
    return Promise.reject(error);
  }
);

export default api;