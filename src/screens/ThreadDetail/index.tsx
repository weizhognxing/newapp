import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import PageHeader from '../../components/PageHeader';
import { threadsApi } from '../../api/threads';
import { divergenceApi } from '../../api/divergence';
import { authStore } from '../../store/auth';
import { BorderRadius, Colors, FontSize, Shadow, Spacing } from '../../constants/theme';
import { getThreadStatusText } from '../../constants/config';

const getGenerationStatusText = (status: number) => {
  const labels: Record<number, string> = {
    0: '待生成',
    1: '生成中',
    2: '待审核',
    3: '生成失败',
    4: '选题异常',
  };
  return labels[status] || `状态${status}`;
};

function stripHtml(input: string) {
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .trim();
}

function resolveThreadContent(thread: any) {
  const raw =
    thread?.content ||
    thread?.article_content ||
    thread?.full_content ||
    thread?.content_html ||
    thread?.body ||
    thread?.generated_content ||
    '';

  if (!raw) return '暂无正文内容';
  const normalized = String(raw).trim();
  return /<[^>]+>/.test(normalized) ? stripHtml(normalized) || '暂无正文内容' : normalized;
}

function extractImageUrls(raw: string) {
  const urls = new Set<string>();
  if (!raw) return [];

  const markdownMatches = raw.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/gi);
  for (const match of markdownMatches) {
    if (match[1]) urls.add(match[1]);
  }

  const htmlMatches = raw.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const match of htmlMatches) {
    if (match[1]) urls.add(match[1]);
  }

  const plainMatches = raw.matchAll(/(https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp))/gi);
  for (const match of plainMatches) {
    if (match[1]) urls.add(match[1]);
  }

  return Array.from(urls);
}

function getTagAttrValue(tagText: string, attrName: string) {
  const pattern = new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, 'i');
  const match = tagText.match(pattern);
  return match?.[1] || '';
}

function normalizePicPlaceholders(text: string, imageUrls: string[] = []) {
  let imageIndex = 0;
  return String(text || '').replace(/<pic\b[^>]*>(?:\s*<\/pic\s*>)?|<pic\b[^>]*\/?>/gi, (tagText) => {
    const src =
      getTagAttrValue(tagText, 'src') ||
      getTagAttrValue(tagText, 'url') ||
      getTagAttrValue(tagText, 'href') ||
      getTagAttrValue(tagText, 'data-src') ||
      imageUrls[imageIndex++];

    if (src) {
      return `\n\n![图片](${src})\n\n`;
    }

    return '\n\n[图片占位符]\n\n';
  });
}

export default function ThreadDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const threadId = route.params?.threadId;
  const fallbackThread = route.params?.thread;
  const dataSource = route.params?.dataSource || 'threads';
  const generationMode = dataSource === 'divergence';

  const [thread, setThread] = useState<any>(fallbackThread || null);
  const [threadImageUrls, setThreadImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = async (silent = false) => {
    const targetId = threadId || fallbackThread?.id;
    if (!targetId) return;

    if (!silent) setLoading(true);
    setError('');
    try {
      let response: any;
      if (generationMode) {
        response = await divergenceApi.getDivergenceDetail(targetId);
        setThreadImageUrls([]);
      } else {
        const tenantId = authStore.getEffectiveTenantId();
        if (!tenantId) return;
        const [detailResponse, imageResponse] = await Promise.all([
          threadsApi.getThreadDetail(targetId, tenantId),
          threadsApi.getThreadImages(targetId).catch(() => null),
        ]);
        response = detailResponse;

        const imagePayload = imageResponse?.data || imageResponse;
        const imageList = Array.isArray(imagePayload)
          ? imagePayload
          : Array.isArray(imagePayload?.images)
            ? imagePayload.images
            : Array.isArray(imagePayload?.data)
              ? imagePayload.data
              : Array.isArray(imagePayload?.data?.images)
                ? imagePayload.data.images
                : [];

        const urls = imageList
          .map((item: any) => item?.image_url || item?.url || item?.image || item?.src || item?.link)
          .filter((url: any) => typeof url === 'string' && url.trim())
          .map((url: string) => url.trim());
        setThreadImageUrls(Array.from(new Set(urls)));
      }
      const detail = response?.data || response;
      setThread(detail);
    } catch (err: any) {
      setError(err?.message || '加载详情失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [threadId, fallbackThread?.id, dataSource]);

  const rawContent = useMemo(() => String(
    thread?.content ||
    thread?.article_content ||
    thread?.full_content ||
    thread?.content_html ||
    thread?.body ||
    thread?.generated_content ||
    ''
  ), [thread]);
  const normalizedRawContent = useMemo(
    () => normalizePicPlaceholders(rawContent, threadImageUrls),
    [rawContent, threadImageUrls]
  );
  const contentText = useMemo(() => resolveThreadContent({ ...thread, content: normalizedRawContent }), [thread, normalizedRawContent]);
  const imageUrls = useMemo(() => {
    const extracted = extractImageUrls(normalizedRawContent);
    return Array.from(new Set([...threadImageUrls, ...extracted]));
  }, [normalizedRawContent, threadImageUrls]);
  const keywordText = useMemo(() => {
    const keywords = thread?.keywords;
    if (Array.isArray(keywords)) return keywords.join('，');
    return keywords || '-';
  }, [thread]);

  const statusColor = useMemo(() => {
    const status = thread?.status;
    const colors: Record<number, string> = generationMode
      ? {
          0: Colors.warning,
          1: Colors.info,
          2: Colors.success,
          3: Colors.danger,
          4: Colors.danger,
        }
      : {
          0: Colors.warning,
          1: Colors.success,
          2: Colors.danger,
          3: Colors.info,
          4: Colors.primary,
          5: Colors.success,
          7: Colors.danger,
        };
    return colors[status] || Colors.textSecondary;
  }, [thread, generationMode]);

  return (
    <View style={styles.container}>
      <PageHeader title="内容详情" subtitle={thread?.title || thread?.theme || '查看正文内容'} onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDetail(true); }} colors={[Colors.primary]} />}
      >
        {loading && !thread ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.stateText}>正在加载详情...</Text>
          </View>
        ) : error && !thread ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>状态</Text>
                <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
                  <Text style={[styles.badgeText, { color: statusColor }]}>
                    {generationMode ? getGenerationStatusText(thread?.status ?? 0) : getThreadStatusText(thread?.status ?? 0)}
                  </Text>
                </View>
              </View>
              <View style={styles.rowBlock}>
                <Text style={styles.label}>标题</Text>
                <Text style={styles.valueTitle}>{thread?.title || thread?.theme || '-'}</Text>
              </View>
              <View style={styles.rowBlock}>
                <Text style={styles.label}>创建时间</Text>
                <Text style={styles.value}>{thread?.created_at ? new Date(thread.created_at).toLocaleString('zh-CN') : '-'}</Text>
              </View>
              <View style={styles.rowBlock}>
                <Text style={styles.label}>关键词</Text>
                <Text style={styles.value}>{keywordText}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>正文内容</Text>
              <Markdown style={markdownStyles}>{contentText}</Markdown>
              {imageUrls.length ? (
                <View style={styles.imageList}>
                  {imageUrls.map((url, index) => (
                    <Image key={`${url}-${index}`} source={{ uri: url }} style={styles.contentImage} resizeMode="cover" />
                  ))}
                </View>
              ) : null}
            </View>

            {!!error && thread ? <Text style={styles.inlineError}>详情刷新失败：{error}</Text> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  centerState: {
    paddingTop: Spacing.xxxl * 2,
    alignItems: 'center',
    gap: Spacing.md,
  },
  stateText: {
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.danger,
    textAlign: 'center',
  },
  inlineError: {
    color: Colors.warning,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rowBlock: {
    marginTop: Spacing.md,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  value: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  valueTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    lineHeight: 28,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  contentText: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  imageList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  contentImage: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight,
  },
});

const markdownStyles: any = {
  body: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: Spacing.sm,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
};
