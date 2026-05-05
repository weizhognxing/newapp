import { request } from './request';

export const accountApi = {
  // 获取账号列表 - GET /accounts
  async getAccountList(params?: any) {
    return await request.get('/accounts', { params });
  },

  // 获取账号类型 - GET /accounts/account-types
  async getAccountTypes() {
    return await request.get('/accounts/account-types');
  },

  // 获取表单选项 - GET /accounts/form-options
  async getFormOptions() {
    return await request.get('/accounts/form-options');
  },

  // 创建运营账号 - POST /accounts
  async createOperatingAccount(data: any) {
    return await request.post('/accounts', data);
  },

  // 获取未绑定用户 - GET /accounts/unbound-users
  async getUnboundUsers() {
    return await request.get('/accounts/unbound-users');
  },

  // 获取账号详情 - GET /accounts/{account_id}
  async getAccountDetail(accountId: number) {
    return await request.get(`/accounts/${accountId}`);
  },

  // 获取账号凭证 - GET /accounts/{account_id}/credentials
  async getAccountCredentials(accountId: number) {
    return await request.get(`/accounts/${accountId}/credentials`);
  },

  // 更新运营账号 - PUT /accounts/{account_id}
  async updateOperatingAccount(accountId: number, data: any) {
    return await request.put(`/accounts/${accountId}`, data);
  },

  // 获取文章类型 - GET /accounts/article-types
  async getArticleTypes() {
    return await request.get('/accounts/article-types');
  },

  // 按类型获取账号 - GET /accounts/accounts/{account_type_id}
  async getAccountsByType(accountTypeId: number) {
    return await request.get(`/accounts/accounts/${accountTypeId}`);
  },

  // 获取平台账号列表 - GET /accounts/platform-accounts
  async getPlatformAccountList() {
    return await request.get('/accounts/platform-accounts');
  },

  // 创建平台账号 - POST /accounts/platform-accounts
  async createPlatformAccount(data: any) {
    return await request.post('/accounts/platform-accounts', data);
  },

  // 更新平台账号 - PUT /accounts/platform-accounts/{id}
  async updatePlatformAccount(id: number, data: any) {
    return await request.put(`/accounts/platform-accounts/${id}`, data);
  },

  // 获取用户信息 - GET /accounts/user/info
  async getUserInfo(username?: string) {
    return await request.get('/accounts/user/info', { params: username ? { username } : {} });
  },

  // 切换账号状态 - PATCH /accounts/{account_id}/status
  async toggleAccountStatus(accountId: number) {
    return await request.patch(`/accounts/${accountId}/status`);
  },
};

export default accountApi;
