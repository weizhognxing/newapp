import { request } from './request';

export const threadsApi = {
  // 获取线程列表 - GET /threads
  async getThreads(
    tenant_id: number,
    skip = 0,
    limit = 20,
    status: number | null = null,
    publish_state: string | null = null,
    statuses: number[] = []
  ) {
    const params: any = { tenant_id, skip, limit };
    if (status !== null && status !== undefined) {
      params.status = status;
    }
    if (publish_state) {
      params.publish_state = publish_state;
    }
    if (Array.isArray(statuses) && statuses.length > 0) {
      params.statuses = statuses;
    }
    return await request.get('/threads', { params });
  },

  // 获取线程详情 - GET /threads/{thread_id}
  async getThreadDetail(thread_id: number, tenant_id: number) {
    return await request.get(`/threads/${thread_id}`, { params: { tenant_id } });
  },

  // 获取发布记录列表 - GET /threads/publish-records/list
  async getPublishRecords(
    tenant_id: number,
    skip = 0,
    limit = 20,
    publish_state: 'all' | 'publishing' | 'completed' | 'failed' = 'all'
  ) {
    return await request.get('/threads/publish-records/list', {
      params: { tenant_id, skip, limit, publish_state },
    });
  },

  // 获取发布记录 - GET /threads/{thread_id}/publish-records
  async getThreadPublishRecords(thread_id: number, tenant_id: number) {
    return await request.get(`/threads/${thread_id}/publish-records`, { params: { tenant_id } });
  },

  // 获取文章图片 - GET /thread-images?article_id={id}
  async getThreadImages(article_id: number) {
    return await request.get('/thread-images', { params: { article_id } });
  },

  // 更新状态 - PUT /threads/{thread_id}/status
  async updateThreadStatus(
    thread_id: number,
    tenant_id: number,
    platform_ids: number[] = [],
    schedules: any[] = []
  ) {
    return await request.put(
      `/threads/${thread_id}/status`,
      { platform_ids, schedules },
      { params: { tenant_id } }
    );
  },

  // 取消发布 - DELETE /threads/{thread_id}/publish-records
  async cancelThreadPublish(thread_id: number, tenant_id: number, platform_ids: number[] = []) {
    return await request.delete(`/threads/${thread_id}/publish-records`, {
      params: { tenant_id },
      data: { platform_ids },
    });
  },

  // 审核通过 - PUT /threads/{thread_id}/status/approve
  async approveThreadStatus(thread_id: number, tenant_id: number) {
    return await request.put(`/threads/${thread_id}/status/approve`, null, {
      params: { tenant_id },
    });
  },

  // 删除线程 - DELETE /threads/{thread_id}
  async deleteThread(thread_id: number, tenant_id: number) {
    return await request.delete(`/threads/${thread_id}`, { params: { tenant_id } });
  },

  // 编辑文章 - PUT /articles/{article_id}
  async updateArticle(
    article_id: number,
    payload: {
      title?: string | null;
      content?: string | null;
      article_type?: string | null;
      image_urls?: string[] | null;
    }
  ) {
    return await request.put(`/articles/${article_id}`, payload);
  },
};

export default threadsApi;
