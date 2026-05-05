// API配置 - 对应前端 .env 中的配置
// 实际使用时请修改为你的后端服务器地址
export const API_BASE_URL = '/api/v1';
export const API_TARGET = 'https://smapp.kangqiao.vip';

// 完整API地址 - 移动端直接请求后端
// 请根据实际部署修改此地址
export const API_FULL_URL = `${API_TARGET}${API_BASE_URL}`;

// 平台租户ID
export const PLATFORM_TENANT_ID = 1;

// 应用标题
export const APP_TITLE = '智能营销平台';

// 线程状态映射
export const THREAD_STATUS_MAP: Record<number, string> = {
  0: '待审核',
  1: '已通过',
  2: '已拒绝',
  3: '等待发布中',
  4: '平台发布中',
  5: '平台已发布',
  7: '平台发布失败',
};

export const getThreadStatusText = (status: number): string => {
  return THREAD_STATUS_MAP[status] ?? `未知(${status})`;
};

// 赛道列表
export const TRACKS = ['all', 'medical', 'tech', 'education', 'internet', 'manufacturing'];

export const TRACK_LABELS: Record<string, string> = {
  all: '全部',
  medical: '医疗',
  tech: '科技',
  education: '教育',
  internet: '互联网',
  manufacturing: '制造业',
};

// 平台来源
export const PLATFORM_SOURCES = [
  'zhihu', 'weibo', 'baijia', 'toutiao', '360',
  'dxy', 'medlive', 'medsci', 'eol', 'yaozh',
  'zol', 'pconline', 'kr36', 'tmtpost', 'chinaz', 'huxiu',
];

export const SOURCE_LABELS: Record<string, string> = {
  zhihu: '知乎',
  weibo: '微博',
  baijia: '百家号',
  toutiao: '头条',
  '360': '360',
  dxy: '丁香园',
  medlive: '医脉通',
  medsci: '梅斯医学',
  eol: '中国教育在线',
  yaozh: '药智网',
  zol: '中关村在线',
  pconline: '太平洋电脑',
  kr36: '36氪',
  tmtpost: '钛媒体',
  chinaz: '站长之家',
  huxiu: '虎嗅',
};
