import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import BottomActionBar from '../../components/BottomActionBar';
import { topicsApi, HotTopic } from '../../api/topics';
import { divergenceStreamStore } from '../../store/divergenceStream';
import { BorderRadius, Colors, FontSize, Gradients, Shadow, Spacing } from '../../constants/theme';
import { PLATFORM_SOURCES, SOURCE_LABELS, TRACK_LABELS, TRACKS } from '../../constants/config';

const PAGE_SIZE = 16;
const ACTION_BAR_HEIGHT = 104;

const normalizeArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.topics)) return payload.topics;
  if (Array.isArray(payload?.data?.topics)) return payload.data.topics;
  return [];
};

export default function TopicCenterScreen() {
  const navigation = useNavigation<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const [streamState, setStreamState] = useState(() => divergenceStreamStore.getState());
  const [topics, setTopics] = useState<HotTopic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<HotTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingHotspots, setRefreshingHotspots] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState('all');
  const [currentTrack, setCurrentTrack] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchTopics = useCallback(async (nextPage = 1, reset = false) => {
    setLoading(true);
    try {
      const response = await topicsApi.getHotTopics({
        skip: (nextPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        source: currentPlatform !== 'all' ? currentPlatform : undefined,
        track: currentTrack !== 'all' ? currentTrack : undefined,
        keyword: keyword.trim() || undefined,
      });

      const list = normalizeArray(response) as HotTopic[];
      setTopics((prev) => (reset ? list : [...prev, ...list]));
      setPage(nextPage);
      setHasNextPage(list.length === PAGE_SIZE);
    } catch (error: any) {
      Alert.alert('加载失败', error?.message || '获取热点失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPlatform, currentTrack, keyword]);

  useEffect(() => {
    fetchTopics(1, true);
  }, [fetchTopics]);

  useEffect(() => {
    const unsubscribe = divergenceStreamStore.subscribe(() => {
      setStreamState(divergenceStreamStore.getState());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopics(1, true);
  };

  const onEndReached = () => {
    if (!loading && hasNextPage) {
      fetchTopics(page + 1);
    }
  };

  const onToggleTopic = (topic: HotTopic) => {
    setSelectedTopics((prev) => {
      const exists = prev.some((item) => item.id === topic.id);
      return exists ? prev.filter((item) => item.id !== topic.id) : [...prev, topic];
    });
  };

  const selectedIds = useMemo(() => new Set(selectedTopics.map((item) => item.id)), [selectedTopics]);

  const handleNext = () => {
    if (!selectedTopics.length) {
      Alert.alert('提示', '请至少选择一个热点再进入下一步');
      return;
    }

    navigation.navigate('RequirementInput', {
      selectedTopics,
    });
  };

  const handleRefreshHotspots = async () => {
    if (refreshingHotspots) return;
    setRefreshingHotspots(true);
    try {
      await topicsApi.updateHotspots('移动端刷新热点');
      Alert.alert('已提交', '热点更新任务已提交，请稍后下拉刷新查看最新结果');
    } catch (error: any) {
      Alert.alert('提交失败', error?.message || '热点更新任务提交失败');
    } finally {
      setRefreshingHotspots(false);
    }
  };

  const renderTopic = ({ item }: { item: HotTopic }) => {
    const selected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        activeOpacity={0.85}
        onPress={() => onToggleTopic(item)}
        onLongPress={() => item.url && Linking.openURL(item.url)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(item.source) }]}>
            <Text style={styles.sourceText}>{SOURCE_LABELS[item.source] || item.source}</Text>
          </View>
          {item.track ? (
            <View style={styles.trackBadge}>
              <Text style={styles.trackText}>{TRACK_LABELS[item.track] || item.track}</Text>
            </View>
          ) : null}
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={selected ? Colors.primary : Colors.textTertiary}
            style={styles.checkIcon}
          />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        {!!item.content && <Text style={styles.content} numberOfLines={2}>{item.content}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="热点筛选"
        subtitle="发现值得传播的增长机会"
        hideBack
      />

      <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroEyebrow}>HOTSPOT RADAR</Text>
        <Text style={styles.heroTitle}>营销热点雷达</Text>
        <Text style={styles.heroSubtitle}>从全网热点中筛选高转化选题，快速进入 AI 发散与内容生成。</Text>
        <View style={styles.heroMetrics}>
          <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{topics.length}</Text><Text style={styles.heroMetricLabel}>当前热点</Text></View>
          <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{selectedTopics.length}</Text><Text style={styles.heroMetricLabel}>已选题材</Text></View>
          <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{currentPlatform === 'all' ? '全域' : SOURCE_LABELS[currentPlatform] || currentPlatform}</Text><Text style={styles.heroMetricLabel}>平台视角</Text></View>
        </View>
      </LinearGradient>

      {streamState.isStreaming ? (
        <View style={styles.streamHintWrap}>
          <TouchableOpacity
            style={styles.streamHintButton}
            onPress={() => navigation.navigate('DivergenceResult')}
          >
            <ActivityIndicator size="small" color={Colors.primaryDark} />
            <Text style={styles.streamHintText}>选题生成进行中，已输出 {streamState.results.length} 条，点击查看</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.toolbarShell}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="关键词筛选热点"
            placeholderTextColor={Colors.textTertiary}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => fetchTopics(1, true)}
          />
          {keyword ? (
            <TouchableOpacity onPress={() => { setKeyword(''); setTimeout(() => fetchTopics(1, true), 0); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshHotspots}>
            {refreshingHotspots ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Ionicons name="refresh" size={18} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.compactLabel}>平台</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <FilterChip label="全部" active={currentPlatform === 'all'} onPress={() => setCurrentPlatform('all')} />
            {PLATFORM_SOURCES.map((source) => (
              <FilterChip
                key={source}
                label={SOURCE_LABELS[source] || source}
                active={currentPlatform === source}
                onPress={() => setCurrentPlatform(source)}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterRow}>
          <Text style={styles.compactLabel}>行业</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {TRACKS.map((track) => (
              <FilterChip
                key={track}
                label={TRACK_LABELS[track] || track}
                active={currentTrack === track}
                onPress={() => setCurrentTrack(track)}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={topics}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderTopic}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        contentContainerStyle={{ paddingBottom: ACTION_BAR_HEIGHT + tabBarHeight + Spacing.xxxl, paddingTop: Spacing.md }}
        ListEmptyComponent={
          !loading ? <EmptyState icon="newspaper-outline" title="暂无热点" message="可以换个筛选条件，或稍后刷新再试。" /> : null
        }
        ListFooterComponent={loading && topics.length > 0 ? <ActivityIndicator style={styles.footerLoader} color={Colors.primary} /> : null}
      />

      <BottomActionBar
        summary={`已选 ${selectedTopics.length} 个热点，下一步再选发布账号`}
        primaryLabel="下一步"
        onPrimaryPress={handleNext}
        disabled={!selectedTopics.length}
        bottomOffset={tabBarHeight}
      />
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getSourceColor(source: string) {
  const colors: Record<string, string> = {
    zhihu: '#2563eb',
    weibo: '#f97316',
    baijia: '#06b6d4',
    toutiao: '#ef4444',
    kr36: '#0ea5e9',
    huxiu: '#f97316',
  };
  return colors[source] || Colors.primary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    overflow: 'hidden',
    ...Shadow.brand,
  },
  heroGlow: {
    position: 'absolute',
    right: -36,
    top: -46,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    color: Colors.textInverse,
    fontSize: FontSize.xxxl,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  heroMetric: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroMetricValue: {
    color: Colors.textInverse,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  heroMetricLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  toolbarShell: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.md,
  },
  streamHintWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  streamHintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  streamHintText: {
    flex: 1,
    color: Colors.primaryDark,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  filterRow: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compactLabel: {
    width: 32,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  refreshButton: {
    marginLeft: Spacing.xs,
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 38,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  chipRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textInverse,
    fontWeight: '800',
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  cardSelected: {
    backgroundColor: '#f8fbff',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sourceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  sourceText: {
    color: Colors.textInverse,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  trackBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.infoBg,
  },
  trackText: {
    color: Colors.info,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  checkIcon: {
    marginLeft: 'auto',
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.text,
    lineHeight: 24,
  },
  content: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: Spacing.xl,
  },
});
