import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { authStore } from '../store/auth';
import { API_FULL_URL } from '../constants/config';

// 创建axios实例 - 对应前端 apiClient
const apiClient: AxiosInstance = axios.create({
  baseURL: API_FULL_URL,
  timeout: 30000,
  paramsSerializer: {
    serialize: (params: Record<string, any>) => {
      const searchParams = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== null && item !== undefined) {
              searchParams.append(key, String(item));
            }
          });
          return;
        }
        searchParams.append(key, String(value));
      });
      return searchParams.toString();
    },
  },
});

// 请求拦截器 - 注入认证头
apiClient.interceptors.request.use(
  (config) => {
    const authHeaders = authStore.getAuthHeaders();
    Object.assign(config.headers, authHeaders);
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error) => {
    // Keep local login cache until user explicitly logs out.
    // Some endpoints may return 401 for permission/scope issues; do not clear session automatically.
    return Promise.reject(error);
  }
);

// 请求方法封装 - 对应前端 request 对象
export const request = {
  get: (url: string, config: AxiosRequestConfig = {}) =>
    apiClient.get(url, {
      ...config,
      headers: { ...authStore.getAuthHeaders(), ...config.headers },
    }),
  post: (url: string, data?: any, config: AxiosRequestConfig = {}) =>
    apiClient.post(url, data, {
      ...config,
      headers: { ...authStore.getAuthHeaders(), ...config.headers },
    }),
  put: (url: string, data?: any, config: AxiosRequestConfig = {}) =>
    apiClient.put(url, data, {
      ...config,
      headers: { ...authStore.getAuthHeaders(), ...config.headers },
    }),
  patch: (url: string, data?: any, config: AxiosRequestConfig = {}) =>
    apiClient.patch(url, data, {
      ...config,
      headers: { ...authStore.getAuthHeaders(), ...config.headers },
    }),
  delete: (url: string, config: AxiosRequestConfig = {}) =>
    apiClient.delete(url, {
      ...config,
      headers: { ...authStore.getAuthHeaders(), ...config.headers },
    }),
};

export { apiClient };
export default request;
