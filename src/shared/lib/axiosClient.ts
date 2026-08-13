import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Create Axios Instance
export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For Thread-safe refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Fast In-Memory API Cache
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10000; // 10 seconds TTL for fast repeated GET calls

// Request Interceptor
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { _cacheKey?: string }) => {
    // In production, we'd get this from a secure storage or Zustand store
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Invalidate cache on mutations (POST, PUT, DELETE)
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get') {
      apiCache.clear();
    } else {
      // Check cache for GET calls
      const cacheKey = `${config.url}?${JSON.stringify(config.params || {})}`;
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        config._cacheKey = cacheKey;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosClient.interceptors.response.use(
  (response) => {
    const res = response.data;
    const config = response.config as InternalAxiosRequestConfig & { _cacheKey?: string };
    const cacheKey = config._cacheKey || `${config.url}?${JSON.stringify(config.params || {})}`;

    let resultData = res;
    // Spring Boot wrapped response: { success: boolean, status: number, message: string, data: any }
    if (res && typeof res === 'object' && 'success' in res) {
      if (res.success) {
        resultData = res.data;
      } else {
        const apiError = {
          code: res.errorCode || 'API_ERROR',
          message: res.message || 'API request failed',
        };
        return Promise.reject(apiError);
      }
    }

    if ((config.method || 'get').toLowerCase() === 'get' && config.url) {
      apiCache.set(cacheKey, { data: resultData, timestamp: Date.now() });
    }

    return resultData;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, put this request in the queue
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Make an independent request to refresh token to avoid loops
        const response = await axios.post(`${axiosClient.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        const wrappedData = response.data;
        if (!wrappedData || !wrappedData.success || !wrappedData.data) {
          throw new Error('Failed to refresh token');
        }

        const newAccessToken = wrappedData.data.accessToken;
        const newRefreshToken = wrappedData.data.refreshToken;

        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Dispatch logout event or handle in Auth Store
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorBody = error.response?.data as any;
    let detailMsg = errorBody?.message || errorBody?.error || errorBody?.details;
    if (errorBody?.errors && typeof errorBody.errors === 'object') {
      const errList = Object.values(errorBody.errors).flat().join(', ');
      if (errList) detailMsg = errList;
    }
    if (errorBody?.constraint) {
      detailMsg = `Lỗi ràng buộc dữ liệu: ${errorBody.constraint}`;
    }

    const traceId = error.response?.headers?.['x-trace-id'] || errorBody?.traceId;
    if (traceId && detailMsg && !detailMsg.includes(traceId)) {
      detailMsg = `${detailMsg} [Trace ID: ${traceId}]`;
    }

    const apiError = {
      code: errorBody?.errorCode || errorBody?.status || 'API_ERROR',
      message: detailMsg || error.message || 'Đã xảy ra lỗi không xác định từ hệ thống.',
      traceId: traceId,
    };

    return Promise.reject(apiError);
  }
);
