/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';

// Create Axios instance with relative paths (points to our Express server)
const api = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: (status) => {
    return (status >= 200 && status < 300) || status === 304;
  },
});

// Interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with automatic retry on network errors for GET requests
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount || 0;

    // Retry idempotent GET requests on network errors or 5xx server issues
    const isGet = (config.method || 'get').toLowerCase() === 'get';
    const isNetworkOr5xx = !error.response || (error.response.status >= 500 && error.response.status <= 599);

    if (isGet && isNetworkOr5xx && config.__retryCount < 2) {
      config.__retryCount += 1;
      const delay = config.__retryCount * 400;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;
