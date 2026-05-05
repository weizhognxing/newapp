import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { threadsApi } from '../../api/threads';
import { authStore } from '../../store/auth';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';

const TABS = [
  { key: 'all', label: '全部', publishState: 'all' as const },
  { key: 'publishing', label: '发布中', publishState: 'publishing' as const },
  { key: 'completed', label: '发布完成', publishState: 'completed' as const },
  { key: 'failed', label: '发布失败', publishState: 'failed' as const },
];

const STATUS_LABELS: Record<number, string> = {
  0: '待发布',
  1: '发布成功',
  2: '发布失败',
  3: '改写失败',
  4: '改写中',
};

const STATUS_COLORS: Record<number, string> = {
  0: Colors.info,
  1: Colors.success,
  2: Colors.danger,
  3: Colors.warning,
  4: Colors.info,
};

const PAGE_SIZE = 20;

const normalizeArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const formatDateTime = (value: unknown) => {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const statusText = (status: number) => STATUS_LABELS[Number(status)] || `状态${status}`;

const shouldShowFailure = (item: any) => [2, 3].includes(Number(item?.status)) && Boolean(item?.failure_reason);

const openArticleUrl = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('提示', '当前链接无法打开');
      return;
    }
    await Linking.openURL(url);
  } catch (error: any) {
    Alert.alert('错误', error?.message || '打开链接失败');
  }
};

export default function PublishListScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [records, setRecords] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];

  const fetchRecords = useCallback(
    async (reset = false) => {
      if (loading) return;
      const tenantId = authStore.getEffectiveTenantId();
      if (!tenantId) return;

      setLoading(true);
      const nextPage = reset ? 1 : page;
      try {
        const response: any = await threadsApi.getPublishRecords(
          tenantId,
          (nextPage - 1) * PAGE_SIZE,
          PAGE_SIZE,
          currentTab.publishState
        );

        const list = normalizeArray(response);
        const totalCount = Number(response?.total || list.length);
        const merged = reset ? list : [...records, ...list];
        const deduped = Array.from(new Map(merged.map((item) => [String(item?.record_id), item])).values());

        setRecords(deduped);
        setTotal(totalCount);
        setPage(nextPage + 1);
        setHasMore(nextPage * PAGE_SIZE < totalCount);
      } catch (error: any) {
        Alert.alert('加载失败', error?.response?.data?.detail || error?.message || '获取发布列表失败');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentTab.publishState, loading, page, records]
  );

  useEffect(() => {
    setRecords([]);
    setPage(1);
    setHasMore(true);
    fetchRecords(true);
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    setRecords([]);
    setPage(1);
    setHasMore(true);
    fetchRecords(true);
  };

  const onEndReached = () => {
    if (!loading && hasMore) {
      fetchRecords(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = Number(item?.status || 0);
    const statusColor = STATUS_COLORS[status] || Colors.textSecondary;
    const articleUrl = String(item?.article_url || '').trim();
    const canOpenUrl = status === 1 && Boolean(articleUrl);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{item?.title || '未命名文章'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}> 
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText(status)}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>平台：</Text>
          <Text style={styles.metaValue}>{item?.platform_name || '-'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>账号：</Text>
          <Text style={styles.metaValue}>{item?.account_name || '-'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>更新时间：</Text>
          <Text style={styles.metaValue}>{formatDateTime(item?.updated_at || item?.created_at)}</Text>
        </View>

        {shouldShowFailure(item) ? (
          <Text style={styles.failureText} numberOfLines={2}>失败原因：{String(item?.failure_reason)}</Text>
        ) : null}

        {canOpenUrl ? (
          <TouchableOpacity style={styles.linkButton} onPress={() => openArticleUrl(articleUrl)}>
            <Text style={styles.linkButtonText}>查看文章</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="发布列表" subtitle="监控多平台分发效果" hideBack />

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalText}>共 {total} 条</Text>
      </View>

      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => String(item?.record_id)}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={!loading ? <EmptyState icon="send-outline" title="暂无发布记录" /> : null}
        ListFooterComponent={loading && records.length > 0 ? <ActivityIndicator style={styles.footer} color={Colors.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    ...Shadow.brand,
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textInverse,
    fontWeight: '900',
  },
  totalRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    alignItems: 'flex-end',
  },
  totalText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.lg,
    lineHeight: 22,
    fontWeight: '900',
  },
  statusBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  metaValue: {
    color: Colors.text,
    fontSize: FontSize.sm,
    flex: 1,
  },
  failureText: {
    marginTop: Spacing.xs,
    color: Colors.danger,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  linkButton: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  linkButtonText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: Spacing.lg,
  },
});
