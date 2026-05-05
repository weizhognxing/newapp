import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { historicalPlanningApi } from '../../api/historicalPlanning';
import { authStore } from '../../store/auth';
import { BorderRadius, Colors, FontSize, Shadow, Spacing } from '../../constants/theme';

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

export default function HistoricalPlanningListScreen() {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const [items, setItems] = useState<any[]>([]);
  const [displayItems, setDisplayItems] = useState<any[]>([]);
  const [displayTopics, setDisplayTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterMode, setFilterMode] = useState<'planning' | 'topic'>('planning');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [detailCache, setDetailCache] = useState<Record<string, any[]>>({});
  const filterSeqRef = useRef(0);

  const tenantId = authStore.getEffectiveTenantId();

  const fetchSessions = useCallback(
    async (reset = false) => {
      if (loading) return;
      if (!tenantId) return;

      const targetPage = reset ? 1 : page;
      setLoading(true);
      try {
        const response: any = await historicalPlanningApi.getHistoricalPlanningSessions({
          tenant_id: tenantId,
          page: targetPage,
          page_size: PAGE_SIZE,
        });
        const list = normalizeArray(response);
        const totalCount = Number(response?.total || list.length);
        const merged = reset ? list : [...items, ...list];
        const deduped = Array.from(
          new Map(merged.map((item) => [String(item?.planning_session_id), item])).values()
        );

        setItems(deduped);
        setTotal(totalCount);
        setPage(targetPage + 1);
        setHasMore(targetPage * PAGE_SIZE < totalCount);
      } catch (error: any) {
        Alert.alert('加载失败', error?.response?.data?.detail || error?.message || '获取历史选题失败');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [items, loading, page]
  );

  const matchPlanning = (session: any, keywordLower: string) => {
    const preview = Array.isArray(session?.source_topics_preview) ? session.source_topics_preview : [];
    const source = preview
      .map((item: any) => `${item?.title || ''} ${item?.summary || ''}`)
      .join(' ')
      .toLowerCase();
    const text = [
      session?.title || '',
      session?.query || '',
      session?.account_name || '',
      session?.account_type_name || '',
      session?.article_type_name || '',
      source,
    ]
      .join(' ')
      .toLowerCase();
    return text.includes(keywordLower);
  };

  const matchTopics = (topicItems: any[], keywordLower: string) => {
    return topicItems.some((topic) => {
      const text = `${topic?.theme || ''} ${topic?.content || ''} ${topic?.keywords || ''}`.toLowerCase();
      return text.includes(keywordLower);
    });
  };

  const normalizeTopicRows = (session: any, topicItems: any[]) => {
    return topicItems.map((topic: any, index: number) => ({
      id: `${session?.planning_session_id || 'session'}-${topic?.id ?? index}`,
      sessionId: String(session?.planning_session_id || ''),
      sessionTitle: session?.title || '历史选题批次',
      theme: topic?.theme || '未命名选题',
      content: topic?.content || '',
      keywords: topic?.keywords || '',
      createdAt: topic?.created_at || session?.created_at || null,
    }));
  };

  const applyFilter = useCallback(async () => {
    const seq = ++filterSeqRef.current;
    const keywordValue = debouncedKeyword.trim().toLowerCase();

    if (!keywordValue) {
      setDisplayItems(items);
      if (filterMode === 'topic') {
        if (!tenantId) {
          setDisplayTopics([]);
        } else {
          setFiltering(true);
          const nextCache: Record<string, any[]> = { ...detailCache };
          const topicGroups = await Promise.all(
            items.map(async (session) => {
              const sessionId = String(session?.planning_session_id || '');
              if (!sessionId) return [];
              let topicItems = nextCache[sessionId];
              if (!topicItems) {
                const detail: any = await historicalPlanningApi.getHistoricalPlanningSessionDetail(sessionId, {
                  tenant_id: tenantId,
                });
                topicItems = Array.isArray(detail?.data) ? detail.data : [];
                nextCache[sessionId] = topicItems;
              }
              return normalizeTopicRows(session, topicItems);
            })
          );
          if (filterSeqRef.current === seq) {
            setDetailCache(nextCache);
            setDisplayTopics(topicGroups.flat());
          }
          setFiltering(false);
        }
      } else {
        setDisplayTopics([]);
      }
      setFiltering(false);
      return;
    }

    if (filterMode === 'planning') {
      setDisplayItems(items.filter((session) => matchPlanning(session, keywordValue)));
      setDisplayTopics([]);
      setFiltering(false);
      return;
    }

    if (!tenantId) {
      setDisplayItems([]);
      setFiltering(false);
      return;
    }

    setFiltering(true);
    const nextCache: Record<string, any[]> = { ...detailCache };

    try {
      const matched = await Promise.all(
        items.map(async (session) => {
          const sessionId = String(session?.planning_session_id || '');
          if (!sessionId) return null;

          let topicItems = nextCache[sessionId];
          if (!topicItems) {
            const detail: any = await historicalPlanningApi.getHistoricalPlanningSessionDetail(sessionId, {
              tenant_id: tenantId,
            });
            topicItems = Array.isArray(detail?.data) ? detail.data : [];
            nextCache[sessionId] = topicItems;
          }

          const topicRows = normalizeTopicRows(session, topicItems);
          const filteredRows = topicRows.filter((topic) => {
            const text = `${topic.theme} ${topic.content} ${topic.keywords}`.toLowerCase();
            return text.includes(keywordValue);
          });
          return {
            session: matchTopics(topicItems, keywordValue) ? session : null,
            topics: filteredRows,
          };
        })
      );

      if (filterSeqRef.current !== seq) return;
      setDetailCache(nextCache);
      const matchedSessions = matched
        .map((item: any) => item?.session)
        .filter(Boolean);
      const matchedTopics = matched.flatMap((item: any) => (Array.isArray(item?.topics) ? item.topics : []));
      setDisplayItems(matchedSessions);
      setDisplayTopics(matchedTopics);
    } catch (error: any) {
      if (filterSeqRef.current !== seq) return;
      Alert.alert('筛选失败', error?.response?.data?.detail || error?.message || '筛选选题失败');
    } finally {
      if (filterSeqRef.current === seq) {
        setFiltering(false);
      }
    }
  }, [debouncedKeyword, detailCache, filterMode, items, tenantId]);

  useEffect(() => {
    fetchSessions(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setItems([]);
    setPage(1);
    setHasMore(true);
    fetchSessions(true);
  };

  const onEndReached = () => {
    if (!loading && hasMore) fetchSessions(false);
  };

  const renderItem = ({ item }: { item: any }) => {
    const preview = Array.isArray(item?.source_topics_preview) ? item.source_topics_preview : [];
    const sourceText = preview[0]?.summary || preview[0]?.title || '未记录来源热点';
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('HistoricalPlanningDetail', {
            planningSessionId: item?.planning_session_id,
          })
        }
      >
        <Text style={styles.cardTitle} numberOfLines={2}>{item?.title || '历史选题批次'}</Text>
        <Text style={styles.sourceText} numberOfLines={2}>{sourceText}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaChip}>{item?.account_type_name || '-'}</Text>
          <Text style={styles.metaChip}>{item?.account_name || '-'}</Text>
          <Text style={styles.metaChip}>{item?.article_type_name || '-'}</Text>
        </View>
        <Text style={styles.timeText}>{formatDateTime(item?.created_at)}</Text>
      </TouchableOpacity>
    );
  };

  const renderTopicItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('HistoricalPlanningDetail', {
            planningSessionId: item?.sessionId,
          })
        }
      >
        <Text style={styles.cardTitle} numberOfLines={2}>{item?.theme || '未命名选题'}</Text>
        <Text style={styles.sourceText} numberOfLines={3}>{item?.content || '-'}</Text>
        {!!item?.keywords ? <Text style={styles.keywordText}>关键词：{item.keywords}</Text> : null}
        <View style={styles.metaRow}>
          <Text style={styles.metaChip}>来源批次</Text>
          <Text style={styles.metaChip} numberOfLines={1}>{item?.sessionTitle || '-'}</Text>
        </View>
        <Text style={styles.timeText}>{formatDateTime(item?.createdAt)}</Text>
      </TouchableOpacity>
    );
  };

  const listData = filterMode === 'planning' ? displayItems : displayTopics;

  return (
    <View style={styles.container}>
      <PageHeader title="选题库" hideBack />
      <View style={styles.filterWrap}>
        {/* <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, filterMode === 'planning' && styles.modeButtonActive]}
            onPress={() => setFilterMode('planning')}
          >
            <Text style={[styles.modeText, filterMode === 'planning' && styles.modeTextActive]}>筛选规划</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, filterMode === 'topic' && styles.modeButtonActive]}
            onPress={() => setFilterMode('topic')}
          >
            <Text style={[styles.modeText, filterMode === 'topic' && styles.modeTextActive]}>筛选选题</Text>
          </TouchableOpacity>
        </View> */}
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder={filterMode === 'planning' ? '输入关键字筛选规划批次' : '输入关键字筛选批次内选题'}
            placeholderTextColor={Colors.textTertiary}
            value={keyword}
            onChangeText={setKeyword}
          />
          {filtering ? <ActivityIndicator size="small" color={Colors.primaryDark} /> : null}
        </View>
      </View>
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filterMode === 'planning'
            ? debouncedKeyword.trim()
              ? `命中 ${displayItems.length} / ${total}`
              : `共 ${total} 个历史批次`
            : debouncedKeyword.trim()
              ? `命中 ${displayTopics.length} 条选题`
              : `共 ${displayTopics.length} 条选题`}
        </Text>
      </View>
      <FlatList
        data={listData}
        renderItem={filterMode === 'planning' ? renderItem : renderTopicItem}
        keyExtractor={(item) => String(item?.planning_session_id || item?.id)}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + Spacing.xxxl }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={!loading && !filtering ? <EmptyState icon="time-outline" title={debouncedKeyword.trim() ? '未找到匹配结果' : '暂无历史选题'} /> : null}
        ListFooterComponent={(loading && listData.length > 0) || filtering ? <ActivityIndicator style={styles.footer} color={Colors.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  countRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  filterWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    gap: Spacing.xs,
  },
  modeButton: {
    flex: 1,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  modeTextActive: {
    color: Colors.textInverse,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: 38,
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  countText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    lineHeight: 22,
  },
  sourceText: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  metaRow: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metaChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryBg,
    color: Colors.primaryDark,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  timeText: {
    marginTop: Spacing.sm,
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
  },
  keywordText: {
    marginTop: Spacing.xs,
    color: Colors.primaryDark,
    fontSize: FontSize.xs,
  },
  footer: {
    paddingVertical: Spacing.lg,
  },
});
