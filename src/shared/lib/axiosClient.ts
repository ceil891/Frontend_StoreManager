import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// ---------------------------------------------------------------------------
// 1. UNINTERCEPTED AXIOS INSTANCE (Dành riêng cho Auth / Refresh Token)
// ---------------------------------------------------------------------------
export const uninterceptedAuthClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// 2. MAIN AXIOS INSTANCE (Dành cho toàn bộ API nghiệp vụ hệ thống)
// ---------------------------------------------------------------------------
export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// 3. THREAD-SAFE CONCURRENT QUEUE & REFRESH LOCK
// ---------------------------------------------------------------------------
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Fast In-Memory API Cache cho các query GET lặp lại
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds TTL
const inFlightRequests = new Map<string, Promise<any>>();

export const clearApiCache = () => {
  apiCache.clear();
  inFlightRequests.clear();
};

/** Tự động xóa token, bắn event và chuyển hướng về trang /login khi phiên hết hạn */
export const handleSessionExpired = (message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('retailhub-auth');
  window.dispatchEvent(new CustomEvent('auth:logout', { detail: { message } }));
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
};

// ---------------------------------------------------------------------------
// 4. REQUEST INTERCEPTOR (Tự động gắn Bearer Token & Quản lý Cache)
// ---------------------------------------------------------------------------
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { _cacheKey?: string }) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Invalidate cache on mutations (POST, PUT, DELETE, PATCH)
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get') {
      apiCache.clear();
    } else {
      const cacheKey = `${config.url}?${JSON.stringify(config.params || {})}`;
      config._cacheKey = cacheKey;
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        // Fast-path: Return cached data via resolved adapter without network request
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {},
        });
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// In-Flight Request Deduplication Wrapper for axiosClient.get
const originalGet = axiosClient.get.bind(axiosClient);
(axiosClient as any).get = function <T = any, R = T, D = any>(url: string, config?: any): Promise<R> {
  const cacheKey = `GET:${url}?${JSON.stringify(config?.params || {})}`;
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }
  const promise = (originalGet as any)(url, config).finally(() => {
    inFlightRequests.delete(cacheKey);
  });
  inFlightRequests.set(cacheKey, promise);
  return promise;
};

// ---------------------------------------------------------------------------
// 5. RESPONSE INTERCEPTOR (Xử lý Data Wrapper, 401 Queue & Error Mapping)
// ---------------------------------------------------------------------------
axiosClient.interceptors.response.use(
  (response) => {
    const res = response.data;
    const config = response.config as InternalAxiosRequestConfig & { _cacheKey?: string };
    const cacheKey = config._cacheKey || `${config.url}?${JSON.stringify(config.params || {})}`;

    let resultData = res;
    // Chuẩn hóa phản hồi bọc từ Spring Boot: { success: boolean, data: any } hoặc { code: number, data: any }
    if (res && typeof res === 'object') {
      if ('success' in res) {
        if (res.success) {
          resultData = res.data;
        } else {
          const apiError = {
            code: res.errorCode || 'API_ERROR',
            message: res.message || 'Yêu cầu API không thành công',
          };
          return Promise.reject(apiError);
        }
      } else if ('code' in res && 'data' in res) {
        if (typeof res.code === 'number' && res.code >= 200 && res.code < 300) {
          resultData = res.data;
        } else if (res.code && res.code !== 200 && res.code !== 201) {
          const apiError = {
            code: res.code || 'API_ERROR',
            message: res.message || 'Yêu cầu API không thành công',
          };
          return Promise.reject(apiError);
        }
      }
    }

    if ((config.method || 'get').toLowerCase() === 'get' && config.url) {
      apiCache.set(cacheKey, { data: resultData, timestamp: Date.now() });
    }

    return resultData;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';

    // Bỏ qua các endpoint xác thực (không thực hiện refresh token khi chính API auth bị 401)
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    const respData = error.response?.data as any;

    // Xử lý khi bị Forbidden (HTTP 403)
    if (error.response?.status === 403 && !isAuthEndpoint) {
      const msg = respData?.message || 'Bạn không có quyền truy cập hoặc tài khoản đã bị vô hiệu hóa. Vui lòng đăng nhập lại.';
      handleSessionExpired(msg);
      return Promise.reject(error);
    }

    // Xử lý khi Token hết hạn hoặc Tài khoản bị vô hiệu hóa (HTTP 401 Unauthorized)
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const respErrorCode = respData?.errorCode;
      if (respErrorCode === 'ACCOUNT_DISABLED' || respErrorCode === 'ACCOUNT_LOCKED') {
        const msg = respData?.message || 'Tài khoản của bạn đã bị vô hiệu hóa hoặc bị khóa. Vui lòng đăng nhập lại.';
        handleSessionExpired(msg);
        return Promise.reject(error);
      }

      // Nếu request này đã từng được retry một lần rồi mà vẫn bị 401 -> Token không hợp lệ -> Logout và về /login
      if (originalRequest._retry) {
        handleSessionExpired('Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // [XỬ LÝ QUEUE REQUEST]: Đẩy các request đồng thời vào hàng chờ nhận Token mới
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        handleSessionExpired('Phiên làm việc đã kết thúc. Vui lòng đăng nhập lại.');
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // [DÙNG UNINTERCEPTED AXIOS INSTANCE]: Gọi trực tiếp API /auth/refresh thuần túy
        const response = await uninterceptedAuthClient.post('/auth/refresh', {
          refreshToken,
        });

        const wrappedData = response.data;
        const authData = wrappedData?.data || wrappedData;
        const newAccessToken = authData?.accessToken;
        const newRefreshToken = authData?.refreshToken;

        if (!newAccessToken) {
          throw new Error('Máy chủ không trả về access token mới');
        }

        // Cập nhật Storage
        localStorage.setItem('access_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        // Giải phóng toàn bộ hàng chờ với Token mới
        processQueue(null, newAccessToken);

        // Thực thi lại request ban đầu với Token mới
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return axiosClient(originalRequest);
      } catch (refreshError: any) {
        // Nếu refresh token thất bại, từ chối toàn bộ hàng chờ và yêu cầu đăng nhập lại
        processQueue(refreshError, null);
        const reason = refreshError?.response?.data?.message || refreshError?.message || 'Phiên đăng nhập đã hết hạn hoặc tài khoản đã bị khóa.';
        handleSessionExpired(reason);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Trích xuất thông báo lỗi chi tiết từ Backend
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
