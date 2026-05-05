import { request } from './request';

export const deviceApi = {
  // 获取设备schema - GET /devices/schema
  async getSchema() {
    return await request.get('/devices/schema');
  },

  // 获取设备列表 - GET /devices
  async getDeviceList(params?: any) {
    return await request.get('/devices', { params });
  },

  // 获取设备详情 - GET /devices/{device_id}
  async getDeviceDetail(deviceId: number) {
    return await request.get(`/devices/${deviceId}`);
  },

  // 创建设备 - POST /devices
  async createDevice(data: any) {
    return await request.post('/devices', data);
  },

  // 更新设备 - PUT /devices/{device_id}
  async updateDevice(deviceId: number, data: any) {
    return await request.put(`/devices/${deviceId}`, data);
  },

  // 获取平台维护设备 - GET /devices/platform-maintenance
  async getPlatformMaintenanceDevices() {
    return await request.get('/devices/platform-maintenance');
  },
};

export const deviceMaintenanceApi = {
  // 获取维护列表 - GET /device-maintenance
  async getMaintenanceList() {
    return await request.get('/device-maintenance');
  },

  // 恢复正常 - PUT /device-maintenance/{device_id}/restore-normal
  async restoreNormal(deviceId: number) {
    return await request.put(`/device-maintenance/${deviceId}/restore-normal`);
  },
};

export default deviceApi;
