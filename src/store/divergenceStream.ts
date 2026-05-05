import { divergenceApi } from '../api/divergence';

export interface DivergenceStreamState {
  query: string;
  sourceTopics: any[];
  accountId: number | string | null;
  accountTypeId: number | string | null;
  articleType: number | string | null;
  streamRequest: any | null;
  results: any[];
  thinkingText: string;
  thinkingEnded: boolean;
  isPreparing: boolean;
  isStreaming: boolean;
  error: string;
}

interface StartTaskParams {
  query: string;
  sourceTopics?: any[];
  accountId?: number | string | null;
  accountTypeId?: number | string | null;
  articleType?: number | string | null;
  streamRequest: any;
}

type Listener = () => void;

const initialState: DivergenceStreamState = {
  query: '',
  sourceTopics: [],
  accountId: null,
  accountTypeId: null,
  articleType: null,
  streamRequest: null,
  results: [],
  thinkingText: '',
  thinkingEnded: false,
  isPreparing: false,
  isStreaming: false,
  error: '',
};

class DivergenceStreamStore {
  private state: DivergenceStreamState = initialState;
  private listeners = new Set<Listener>();
  private taskId = 0;

  getState() {
    return this.state;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private setState(partial: Partial<DivergenceStreamState>) {
    this.state = { ...this.state, ...partial };
    this.emit();
  }

  reset() {
    this.taskId += 1;
    this.state = initialState;
    this.emit();
  }

  async startTask(params: StartTaskParams) {
    const currentTaskId = this.taskId + 1;
    this.taskId = currentTaskId;

    const request = params.streamRequest || {};
    this.state = {
      ...initialState,
      query: params.query || request.query || '',
      sourceTopics: params.sourceTopics || [],
      accountId: params.accountId ?? null,
      accountTypeId: params.accountTypeId ?? null,
      articleType: params.articleType ?? null,
      streamRequest: request,
      isPreparing: true,
      isStreaming: true,
    };
    this.emit();

    const applyIfCurrent = (partial: Partial<DivergenceStreamState>) => {
      if (this.taskId !== currentTaskId) return;
      this.setState(partial);
    };

    try {
      const finalResults = await divergenceApi.summarizeStream(
        request.query || params.query || '',
        request.topics || [],
        request.summary,
        request.position,
        request.userId,
        request.topicPrompt,
        (chunk) => {
          if (this.taskId !== currentTaskId) return;
          if (chunk.type === 'stream_open') {
            this.setState({ isPreparing: false, isStreaming: true, error: '' });
            return;
          }
          if (chunk.type === 'thinking') {
            this.setState({
              thinkingText: `${this.state.thinkingText}${chunk.content || ''}`,
              isPreparing: false,
              isStreaming: true,
            });
            return;
          }
          if (chunk.type === 'thinking_end') {
            this.setState({ thinkingEnded: true, isPreparing: false });
            return;
          }
          if (chunk.type === 'result' && chunk.data) {
            this.setState({
              results: [...this.state.results, chunk.data],
              isPreparing: false,
              isStreaming: true,
            });
          }
        }
      );

      applyIfCurrent({
        results: Array.isArray(finalResults) ? finalResults : this.state.results,
        isPreparing: false,
        isStreaming: false,
        thinkingEnded: true,
        error: '',
      });
    } catch (error: any) {
      applyIfCurrent({
        isPreparing: false,
        isStreaming: false,
        error: error?.message || 'AI 生成失败，请稍后重试',
      });
    }
  }
}

export const divergenceStreamStore = new DivergenceStreamStore();
