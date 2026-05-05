import { request } from './request';

export const tenantsApi = {
  // 获取租户列表 - GET /tenants
  async getTenants() {
    return await request.get('/tenants');
  },

  // 获取租户详情 - GET /tenants/{id}
  async getTenant(id: number) {
    return await request.get(`/tenants/${id}`);
  },

  // 创建租户 - POST /tenants
  async createTenant(data: any) {
    return await request.post('/tenants', data);
  },

  // 更新租户 - PUT /tenants/{id}
  async updateTenant(id: number, data: any) {
    return await request.put(`/tenants/${id}`, data);
  },

  // 删除租户 - DELETE /tenants/{id}
  async deleteTenant(id: number) {
    return await request.delete(`/tenants/${id}`);
  },
};

export const staffApi = {
  // 获取权限列表 - GET /staff-permissions/permissions
  async getPermissions() {
    return await request.get('/staff-permissions/permissions');
  },

  // 获取用户列表 - GET /staff-permissions/users
  async getUsers() {
    return await request.get('/staff-permissions/users');
  },

  // 更新权限 - PUT /staff-permissions/tenants/{tenant_id}/permissions
  async updatePermissions(tenantId: number, data: any) {
    return await request.put(`/staff-permissions/tenants/${tenantId}/permissions`, data);
  },

  // 删除租户 - DELETE /staff-permissions/tenants/{tenant_id}
  async deleteTenant(tenantId: number) {
    return await request.delete(`/staff-permissions/tenants/${tenantId}`);
  },

  // 创建用户 - POST /staff-permissions/users
  async createUser(data: any) {
    return await request.post('/staff-permissions/users', data);
  },

  // 更新用户 - PUT /staff-permissions/users/{user_id}
  async updateUser(userId: number, data: any) {
    return await request.put(`/staff-permissions/users/${userId}`, data);
  },

  // 删除用户 - DELETE /staff-permissions/users/{user_id}
  async deleteUser(userId: number) {
    return await request.delete(`/staff-permissions/users/${userId}`);
  },
};

export const platformConfigApi = {
  // 获取平台列表 - GET /platform-config/platforms
  async getPlatforms() {
    return await request.get('/platform-config/platforms');
  },

  // 获取概览 - GET /platform-config/overview
  async getOverview() {
    return await request.get('/platform-config/overview');
  },

  // 保存配置 - PUT /platform-config
  async saveConfig(data: any) {
    return await request.put('/platform-config', data);
  },

  // 更新文章类型提示词 - PUT /platform-config/article-types/{article_type_id}
  async saveArticleTypePrompt(articleTypeId: number, data: any) {
    return await request.put(`/platform-config/article-types/${articleTypeId}`, data);
  },
};

export default tenantsApi;
