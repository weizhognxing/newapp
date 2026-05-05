import AsyncStorage from '@react-native-async-storage/async-storage';
import { PLATFORM_TENANT_ID } from '../constants/config';

const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  ACTIVE_TENANT_ID: 'active_tenant_id',
  IMPERSONATED_TENANT_ID: 'impersonated_tenant_id',
  IMPERSONATED_TENANT_NAME: 'impersonated_tenant_name',
};

export interface User {
  id: number;
  username: string;
  nickname?: string;
  role?: string;
  real_role?: string;
  tenant_id: number | null;
  real_tenant_id: number | null;
  thend_id?: number | null;
  is_impersonated: boolean;
  permissions: string[];
}

// 标准化用户数据 - 对应前端 normalizeUser
export const normalizeUser = (user: any): User | null => {
  if (!user) return null;
  const normalizedTenantId = user.tenant_id ?? user.thend_id ?? null;
  const normalizedRealTenantId = user.real_tenant_id ?? normalizedTenantId;
  return {
    ...user,
    tenant_id: normalizedTenantId,
    real_tenant_id: normalizedRealTenantId,
    thend_id: user.thend_id ?? normalizedTenantId,
    real_role: user.real_role ?? user.role ?? null,
    is_impersonated: Boolean(user.is_impersonated),
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  };
};

// 从响应中提取token
export const extractToken = (payload: any): string | null => {
  return (
    payload?.token ||
    payload?.access_token ||
    payload?.data?.token ||
    payload?.data?.access_token ||
    null
  );
};

// 从响应中提取用户
export const extractUser = (payload: any): any => {
  return payload?.user || payload?.data?.user || null;
};

class AuthStore {
  private token: string | null = null;
  private user: User | null = null;
  private impersonatedTenantId: number | null = null;
  private listeners: Set<() => void> = new Set();

  async initialize() {
    try {
      const [token, userStr, impTenantId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.IMPERSONATED_TENANT_ID),
      ]);
      this.token = token;
      if (userStr) {
        try {
          this.user = normalizeUser(JSON.parse(userStr));
        } catch { }
      }
      if (impTenantId) {
        const parsed = Number(impTenantId);
        this.impersonatedTenantId = Number.isFinite(parsed) ? parsed : null;
      }
    } catch (e) {
      console.error('AuthStore initialize error:', e);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  isPlatformAdmin(): boolean {
    const realTenantId = this.user?.real_tenant_id ?? this.user?.tenant_id;
    return realTenantId === PLATFORM_TENANT_ID;
  }

  isImpersonated(): boolean {
    return Boolean(this.user?.is_impersonated);
  }

  getEffectiveTenantId(): number | null {
    if (this.isPlatformAdmin() && this.isImpersonated()) {
      return this.impersonatedTenantId;
    }
    return this.user?.tenant_id ?? null;
  }

  hasPermission(permission: string): boolean {
    return this.user?.permissions?.includes(permission) ?? false;
  }

  // 获取请求头 - 对应前端 getAuthHeaders
  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = this.token.startsWith('Bearer ')
        ? this.token
        : `Bearer ${this.token}`;
    }
    const tenantId = this.getEffectiveTenantId();
    if (tenantId !== null) {
      headers['X-Tenant-ID'] = String(tenantId);
    }
    return headers;
  }

  async setAuth(token: string, user: any) {
    this.token = token;
    this.user = normalizeUser(user);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user)),
    ]);
    this.notifyListeners();
  }

  async setUser(user: any) {
    this.user = normalizeUser(user);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user));
    this.notifyListeners();
  }

  async setImpersonatedTenantId(tenantId: number | null) {
    this.impersonatedTenantId = tenantId;
    if (tenantId !== null) {
      await AsyncStorage.setItem(STORAGE_KEYS.IMPERSONATED_TENANT_ID, String(tenantId));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.IMPERSONATED_TENANT_ID);
    }
    this.notifyListeners();
  }

  async logout() {
    this.token = null;
    this.user = null;
    this.impersonatedTenantId = null;
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      AsyncStorage.removeItem(STORAGE_KEYS.USER),
      AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_TENANT_ID),
      AsyncStorage.removeItem(STORAGE_KEYS.IMPERSONATED_TENANT_ID),
      AsyncStorage.removeItem(STORAGE_KEYS.IMPERSONATED_TENANT_NAME),
    ]);
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

export const authStore = new AuthStore();
export default authStore;
