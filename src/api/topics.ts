import { request } from './request';

export interface HotTopic {
  id: number;
  source: string;
  title: string;
  url: string;
  image?: string;
  content?: string;
  heat?: number;
  track?: string;
  created_at?: string;
}

export const topicsApi = {
  // 获取热点列表 - GET /track/hot_topics
  async getHotTopics(params: {
    track?: string;
    skip?: number;
    limit?: number;
    source?: string;
    keyword?: string;
  } = {}) {
    return await request.get('/track/hot_topics', { params });
  },

  // 搜索热点 - GET /track/hot_topics/search
  async searchHotTopics(params: {
    keyword?: string;
    skip?: number;
    limit?: number;
  } = {}) {
    return await request.get('/track/hot_topics/search', { params });
  },

  // 按赛道获取 - GET /track/hot_topics/{track}
  async getHotTopicsByTrack(track: string) {
    return await request.get(`/track/hot_topics/${track}`);
  },

  // 获取推荐热点 - GET /track/hot_topics/recommend
  async getRecommendedHotTopics(params: {
    account_id: number;
    track?: string;
    skip?: number;
    limit?: number;
    source?: string;
    keyword?: string;
  }) {
    return await request.get('/track/hot_topics/recommend', { params });
  },

  // 获取赛道列表 - GET /track/tracks
  async getTracks() {
    return await request.get('/track/tracks');
  },

  // 更新热点 - POST /xuanti/update-hotspots
  async updateHotspots(note?: string) {
    return await request.post('/xuanti/update-hotspots', { note });
  },
};

export default topicsApi;
