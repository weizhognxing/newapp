import { request, apiClient } from './request';
import { authStore } from '../store/auth';
import { API_FULL_URL } from '../constants/config';

export const divergenceApi = {
  // AI总结 - POST /dify/summarize
  async summarize(
    query: string,
    topics: any[] = [],
    summary?: string | null,
    position?: string | null,
    topicPrompt?: string | null
  ) {
    try {
      const response: any = await request.post('/dify/summarize', {
        query,
        topics: topics || [],
        summary,
        position,
        topic_divergence_prompt: topicPrompt,
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('请求超时，AI 生成时间较长，请稍后重试');
      }
      if (error.response) {
        throw new Error(error.response.data?.detail || `服务器错误：${error.response.status}`);
      }
      throw new Error(`网络错误：${error.message}`);
    }
  },

  // AI流式总结 - POST /dify/summarize/stream (SSE)
  async summarizeStream(
    query: string,
    topics: any[] = [],
    summary?: string | null,
    position?: string | null,
    userId?: number | null,
    topicPrompt?: string | null,
    onChunk?: (chunk: { type: string; data?: any; content?: string }) => void
  ) {
    const payload = {
      query,
      topics: topics || [],
      summary,
      position,
      user_id: userId,
      topic_divergence_prompt: topicPrompt,
    };

    const authHeaders = authStore.getAuthHeaders();
    const createStreamState = () => {
      const results: any[] = [];
      const seenTopics = new Set<string>();
      let buffer = '';

      const getTopicKey = (topic: any) => {
        const theme = topic?.theme?.trim?.() || '';
        const content = topic?.content?.trim?.() || '';
        const keywords = topic?.keywords?.trim?.() || '';
        return `${theme}::${content}::${keywords}`;
      };

      const addTopic = (topic: any) => {
        if (!topic || !topic.theme) return;
        const topicKey = getTopicKey(topic);
        if (seenTopics.has(topicKey)) return;
        seenTopics.add(topicKey);
        results.push(topic);
        onChunk?.({ type: 'result', data: topic });
      };

      const processText = (incoming: string) => {
        if (!incoming) return;
        buffer += incoming;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(':')) continue;
          if (!trimmedLine.startsWith('data:')) continue;

          const dataStr = trimmedLine.slice(5).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.error) continue;
            if (data.type === 'thinking') {
              onChunk?.({ type: 'thinking', content: data.content || '' });
              continue;
            }
            if (data.type === 'thinking_end') {
              onChunk?.({ type: 'thinking_end' });
              continue;
            }
            if (data.type === 'result' && data.data && typeof data.data === 'object') {
              addTopic(data.data);
              continue;
            }
            if (Array.isArray(data.schema)) {
              data.schema.forEach(addTopic);
              continue;
            }
            if (Array.isArray(data.data)) {
              data.data.forEach(addTopic);
              continue;
            }
            if (data.data && typeof data.data === 'object') {
              addTopic(data.data);
              continue;
            }
            if (data.schema && typeof data.schema === 'object') {
              addTopic(data.schema);
            }
          } catch (error) {
            // Ignore incomplete JSON chunks.
          }
        }
      };

      return {
        results,
        processText,
        flush() {
          if (buffer.trim()) processText('\n');
        },
      };
    };

    try {
      const response = await fetch(`${API_FULL_URL}/dify/summarize/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Notify UI as soon as stream connection is accepted.
      onChunk?.({ type: 'stream_open' });

      const reader = response.body?.getReader?.();
      if (!reader) {
        throw new Error('STREAM_READER_UNAVAILABLE');
      }

      const decoder = new TextDecoder('utf-8');
      const streamState = createStreamState();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamState.processText(decoder.decode(value, { stream: true }));
      }

      streamState.flush();
      return streamState.results;
    } catch (error: any) {
      if (error?.message !== 'STREAM_READER_UNAVAILABLE') {
        throw error;
      }

      return await new Promise<any[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const streamState = createStreamState();
        let processedLength = 0;
        let streamOpened = false;

        xhr.open('POST', `${API_FULL_URL}/dify/summarize/stream`, true);
        xhr.timeout = 120000;
        xhr.setRequestHeader('Content-Type', 'application/json');
        Object.entries(authHeaders).forEach(([key, value]) => {
          xhr.setRequestHeader(key, String(value));
        });

        const processIncoming = () => {
          const responseText = xhr.responseText || '';
          if (responseText.length <= processedLength) return;
          const newChunk = responseText.slice(processedLength);
          processedLength = responseText.length;
          streamState.processText(newChunk);
        };

        xhr.onprogress = processIncoming;
        xhr.onreadystatechange = () => {
          if (!streamOpened && xhr.readyState >= XMLHttpRequest.HEADERS_RECEIVED && xhr.status >= 200 && xhr.status < 300) {
            streamOpened = true;
            onChunk?.({ type: 'stream_open' });
          }

          if (xhr.readyState === XMLHttpRequest.LOADING) {
            processIncoming();
          }

          if (xhr.readyState === XMLHttpRequest.DONE) {
            processIncoming();
            streamState.flush();

            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(streamState.results);
              return;
            }

            try {
              const errorPayload = JSON.parse(xhr.responseText || '{}');
              reject(new Error(errorPayload?.detail || `HTTP error! status: ${xhr.status}`));
            } catch (parseError) {
              reject(new Error(`HTTP error! status: ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('网络错误：流式连接失败'));
        xhr.ontimeout = () => reject(new Error('请求超时，AI 生成时间较长，请稍后重试'));
        xhr.send(JSON.stringify(payload));
      });
    }
  },

  // 保存发散结果 - POST /divergence/save
  async saveDivergence(params: any) {
    return await request.post('/divergence/save', params);
  },

  // 获取发散列表
  async getDivergenceList(params: any = {}) {
    const tenantId = Number(params?.tenant_id);
    const requestParams = { ...params };
    delete requestParams.tenant_id;

    return Number.isFinite(tenantId) && tenantId >= 0
      ? await request.get(`/divergence/tenant/${tenantId}`, { params: requestParams })
      : await request.get('/divergence/list', { params: requestParams });
  },

  // 获取发散详情 - GET /divergence/{itemId}
  async getDivergenceDetail(itemId: number) {
    return await request.get(`/divergence/${itemId}`);
  },

  // 删除发散 - DELETE /divergence/{itemId}
  async deleteDivergence(itemId: number) {
    return await request.delete(`/divergence/${itemId}`);
  },

  // 获取进度 - POST /divergence/progress
  async getProgress(themes: string[]) {
    return await request.post('/divergence/progress', { themes });
  },
};

export default divergenceApi;
