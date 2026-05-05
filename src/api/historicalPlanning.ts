import { request } from './request';

export const historicalPlanningApi = {
  async getHistoricalPlanningSessions(params: {
    page?: number;
    page_size?: number;
    tenant_id?: number;
    user_id?: number;
  } = {}) {
    return await request.get('/historical-planning/sessions', { params });
  },

  async getHistoricalPlanningSessionDetail(
    planning_session_id: string,
    params: { tenant_id?: number } = {}
  ) {
    return await request.get(`/historical-planning/session/${planning_session_id}`, { params });
  },
};

export default historicalPlanningApi;
