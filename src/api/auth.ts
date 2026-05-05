import { apiClient } from './request';
import { authStore, extractToken, extractUser, normalizeUser } from '../store/auth';

const saveAuthData = async (response: any) => {
  const token = extractToken(response);
  const user = normalizeUser(extractUser(response));
  if (token && user) {
    await authStore.setAuth(token, user);
  }
  return { ...response, token, user };
};

export const authApi = {
  // 登录 - POST /auth/login
  async login(username: string, password: string) {
    const response: any = await apiClient.post('/auth/login', { username, password });
    return saveAuthData(response);
  },

  // 获取当前用户 - GET /auth/me
  async getCurrentUser() {
    const user: any = await apiClient.get('/auth/me');
    const normalizedUser = normalizeUser(user);
    if (normalizedUser) {
      await authStore.setUser(normalizedUser);
    }
    return normalizedUser;
  },

  // 检查认证状态 - GET /auth/check
  async checkAuth() {
    return await apiClient.get('/auth/check');
  },

  // 登出
  async logout() {
    await authStore.logout();
  },

  // 获取用户列表 - GET /auth/users
  async getUsers() {
    return await apiClient.get('/auth/users');
  },

  // 切换租户 - POST /auth/switch-tenant
  async switchTenant(tenantId: number) {
    const response: any = await apiClient.post('/auth/switch-tenant', { tenant_id: tenantId });
    return saveAuthData(response);
  },

  // 恢复真实身份 - POST /auth/restore-real-identity
  async restoreRealIdentity() {
    const response: any = await apiClient.post('/auth/restore-real-identity');
    return saveAuthData(response);
  },
};

export default authApi;
