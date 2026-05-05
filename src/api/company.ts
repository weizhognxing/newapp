import { request } from './request';

export const companyApi = {
  // 获取公司列表 - GET /companies/directory
  async getDirectory(params?: any) {
    return await request.get('/companies/directory', { params });
  },

  // 获取公司详情 - GET /companies/tenant/{tenant_id}
  async getTenantDetail(tenantId: number) {
    return await request.get(`/companies/tenant/${tenantId}`);
  },

  // 创建公司 - POST /companies/tenant
  async createTenant(data: any) {
    return await request.post('/companies/tenant', data);
  },

  // 更新公司 - PUT /companies/tenant/{tenant_id}
  async updateTenant(tenantId: number, data: any) {
    return await request.put(`/companies/tenant/${tenantId}`, data);
  },

  // 获取事实包列表 - GET /companies/fact-packages
  async getFactPackages(params?: any) {
    return await request.get('/companies/fact-packages', { params });
  },

  // 创建事实包 - POST /companies/fact-packages
  async createFactPackage(data: any) {
    return await request.post('/companies/fact-packages', data);
  },

  // 更新事实包 - PUT /companies/fact-packages/{fact_id}
  async updateFactPackage(factId: number, data: any) {
    return await request.put(`/companies/fact-packages/${factId}`, data);
  },

  // 删除事实包 - DELETE /companies/fact-packages/{fact_id}
  async deleteFactPackage(factId: number) {
    return await request.delete(`/companies/fact-packages/${factId}`);
  },

  // 批量删除事实包 - DELETE /companies/fact-packages/batch
  async batchDeleteFactPackages(ids: number[]) {
    return await request.delete('/companies/fact-packages/batch', { data: { ids } });
  },

  // 获取行业分类 - GET /companies/industry-categories
  async getIndustryCategories() {
    return await request.get('/companies/industry-categories');
  },

  // 上传Logo - POST /companies/tenant/{tenant_id}/logo
  async uploadLogo(tenantId: number, imageData: any, filename: string) {
    return await request.post(`/companies/tenant/${tenantId}/logo?filename=${filename}`, imageData, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  },
};

export default companyApi;
