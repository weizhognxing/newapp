import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import PageHeader from '../../components/PageHeader';
import BottomActionBar from '../../components/BottomActionBar';
import { divergenceApi } from '../../api/divergence';
import { authStore } from '../../store/auth';
import { divergenceStreamStore } from '../../store/divergenceStream';
import { BorderRadius, Colors, FontSize, Shadow, Spacing } from '../../constants/theme';

interface DivergenceItem {
  theme: string;
  content: string;
  keywords?: string;
}

interface StreamRequest {
  query: string;
  topics: string[];
  summary?: string | null;
  position?: string | null;
  userId?: number | null;
  topicPrompt?: string | null;
}

export default function DivergenceResultScreen() {
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const initialResults: DivergenceItem[] = route.params?.results || [];
  const streamRequest: StreamRequest | undefined = route.params?.streamRequest;
  const query: string = route.params?.query || streamRequest?.query || '';
  const [streamState, setStreamState] = useState(() => divergenceStreamStore.getState());

  const [results, setResults] = useState<DivergenceItem[]>(initialResults);
  const [thinkingText, setThinkingText] = useState('');
  const [thinkingExpanded, setThinkingExpanded] = useState(true);
  const [thinkingEnded, setThinkingEnded] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const startOnceRef = useRef(false);
  const listRef = useRef<FlatList<DivergenceItem>>(null);
  const thinkingScrollRef = useRef<ScrollView>(null);

  const goTopicCenter = () => {
    try {
      navigation.navigate('TopicHotspotSelection');
      return;
    } catch (e) {
      // Fallback to parent tab navigation when current navigator can't resolve route.
    }

    const parentNav = navigation.getParent?.();
    if (parentNav) {
      parentNav.navigate('TopicTab', { screen: 'TopicHotspotSelection' });
    }
  };

  useEffect(() => {
    if (!thinkingExpanded) return;
    thinkingScrollRef.current?.scrollToEnd({ animated: true });
  }, [thinkingExpanded, thinkingText]);

  useEffect(() => {
    const unsubscribe = divergenceStreamStore.subscribe(() => {
      setStreamState(divergenceStreamStore.getState());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setResults(Array.isArray(streamState.results) ? streamState.results : []);
    setThinkingText(streamState.thinkingText || '');
    setThinkingEnded(Boolean(streamState.thinkingEnded));
    setIsPreparing(Boolean(streamState.isPreparing));
    setIsStreaming(Boolean(streamState.isStreaming));
    setStreamError(streamState.error || '');
    if (streamState.thinkingEnded) {
      setThinkingExpanded(false);
    }
  }, [streamState]);

  useEffect(() => {
    if (!streamRequest || startOnceRef.current) return;
    startOnceRef.current = true;

    divergenceStreamStore.startTask({
      query,
      sourceTopics: route.params?.sourceTopics || [],
      accountId: route.params?.accountId ?? null,
      accountTypeId: route.params?.accountTypeId ?? null,
      articleType: route.params?.articleType ?? null,
      streamRequest,
    });
  }, [query, route.params, streamRequest]);

  const toggleSelect = (index: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === results.length) {
      setSelectedItems(new Set());
      return;
    }
    setSelectedItems(new Set(results.map((_, index) => index)));
  };

  const handleRetry = () => {
    const current = divergenceStreamStore.getState();
    if (!current.streamRequest) {
      Alert.alert('提示', '缺少流式任务参数，请返回上一步重试');
      return;
    }

    setSelectedItems(new Set());
    setThinkingExpanded(true);
    divergenceStreamStore.startTask({
      query: current.query,
      sourceTopics: current.sourceTopics,
      accountId: current.accountId,
      accountTypeId: current.accountTypeId,
      articleType: current.articleType,
      streamRequest: current.streamRequest,
    });
  };

  const handleSave = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('提示', '请选择要保存的发散结果');
      return;
    }

    setSaving(true);
    try {
      const userId = authStore.getUser()?.id;
      const tenantId = authStore.getEffectiveTenantId();

      if (tenantId === null || tenantId === undefined || userId === null || userId === undefined) {
        throw new Error('登录信息缺失，请重新登录后再试');
      }

      const items = results
        .filter((_, index) => selectedItems.has(index))
        .map((item) => ({
          theme: item.theme,
          content: item.content,
          keywords: item.keywords || '',
        }));

      await divergenceApi.saveDivergence({
        tenant_id: tenantId,
        user_id: userId,
        status: 0,
        items,
        note: '',
        source_topics: JSON.stringify(streamState.sourceTopics || []),
        account_type_id: streamState.accountTypeId !== null && streamState.accountTypeId !== undefined ? Number(streamState.accountTypeId) : null,
        account_id: streamState.accountId !== null && streamState.accountId !== undefined ? Number(streamState.accountId) : null,
        article_type: streamState.articleType !== null && streamState.articleType !== undefined ? String(streamState.articleType) : null,
      });

      navigation.popToTop();
      navigation.getParent()?.navigate('GenerationListTab');
    } catch (error: any) {
      Alert.alert('错误', error?.response?.data?.detail || error?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const subtitle = useMemo(() => {
    if (streamError) return '生成失败，请重试';
    if (isStreaming) return `AI 正在生成中，已输出 ${results.length} 条`; 
    return `共 ${results.length} 条，已选 ${selectedItems.size} 条`;
  }, [isStreaming, results.length, selectedItems.size, streamError]);

  const renderItem = ({ item, index }: { item: DivergenceItem; index: number }) => {
    const selected = selectedItems.has(index);
    return (
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        onPress={() => toggleSelect(index)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <Text style={styles.cardTheme} numberOfLines={2}>{item.theme}</Text>
          {selected ? <Ionicons name="checkmark-circle" size={22} color={Colors.primary} /> : null}
        </View>
        <Text style={styles.cardContent}>{item.content}</Text>
        {item.keywords ? (
          <View style={styles.keywordsRow}>
            {item.keywords.split(/[,，、\s]+/).filter(Boolean).map((keyword, index2) => (
              <View key={`${keyword}-${index2}`} style={styles.keywordTag}>
                <Text style={styles.keywordText}>{keyword}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="选题生成" subtitle={subtitle} onBack={() => navigation.goBack()} />

      {isStreaming ? (
        <View style={styles.returnBannerWrap}>
          <TouchableOpacity
            style={styles.returnBannerButton}
            onPress={goTopicCenter}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.primaryDark} />
            <Text style={styles.returnBannerText}>返回选题中心</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!!thinkingText ? (
        <View style={styles.thinkingCard}>
          <TouchableOpacity style={styles.thinkingHeader} onPress={() => setThinkingExpanded((prev) => !prev)}>
            <View>
              <Text style={styles.thinkingTitle}>AI 思考过程</Text>
              <Text style={styles.thinkingStatus}>{thinkingEnded ? '思考完成' : '正在实时输出中'}</Text>
            </View>
            <Text style={styles.thinkingToggle}>{thinkingExpanded ? '收起' : '展开'}</Text>
          </TouchableOpacity>
          {thinkingExpanded ? (
            <ScrollView ref={thinkingScrollRef} style={[styles.thinkingBodyWrap, { maxHeight: SCREEN_HEIGHT * 0.7 }]}> 
              <Text style={styles.thinkingBody}>{thinkingText}</Text>
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      {streamError ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={28} color={Colors.danger} />
          <Text style={styles.errorTitle}>生成失败</Text>
          <Text style={styles.errorText}>{streamError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>重新生成</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {results.length > 0 ? (
        <View style={styles.toolbar}>
          <TouchableOpacity style={styles.toolButton} onPress={selectAll}>
            <Ionicons
              name={selectedItems.size === results.length ? 'checkbox' : 'square-outline'}
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.toolButtonText}>
              {selectedItems.size === results.length ? '取消全选' : '全选'}
            </Text>
          </TouchableOpacity>
          {isStreaming ? (
            <View style={styles.streamingInlineBadge}>
              <ActivityIndicator size="small" color={Colors.primaryDark} />
              <Text style={styles.streamingInlineText}>实时生成中...</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <FlatList
        ref={listRef}
        data={results}
        renderItem={renderItem}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarHeight + 140 }]}
        onContentSizeChange={() => {
          if (isStreaming && results.length > 0) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          isStreaming ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.emptyText}>AI 正在生成中，请稍候...</Text>
            </View>
          ) : !streamError ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bulb-outline" size={64} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>暂无发散结果</Text>
            </View>
          ) : null
        }
      />

      <BottomActionBar
        summary={`已选 ${selectedItems.size} / ${results.length} 个选题`}
        primaryLabel={saving ? '提交中...' : '提交到生成列表'}
        onPrimaryPress={handleSave}
        disabled={saving || selectedItems.size === 0 || isStreaming}
        secondaryLabel="上一步"
        onSecondaryPress={() => navigation.goBack()}
        bottomOffset={tabBarHeight}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  thinkingCard: {
    margin: Spacing.lg,
    marginBottom: 0,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  thinkingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  thinkingTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  thinkingStatus: {
    marginTop: 4,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  thinkingToggle: {
    color: Colors.primary,
    fontWeight: '600',
  },
  thinkingBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  thinkingBodyWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  errorCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  errorTitle: {
    color: Colors.danger,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retryButtonText: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toolButtonText: {
    color: Colors.primary,
    fontSize: FontSize.md,
  },
  streamingInlineBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  streamingInlineText: {
    color: Colors.primaryDark,
    fontSize: FontSize.sm,
  },
  listContent: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  indexText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  cardTheme: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  cardContent: {
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  keywordTag: {
    backgroundColor: Colors.infoBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  keywordText: {
    color: Colors.info,
    fontSize: FontSize.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl * 2,
  },
  emptyText: {
    marginTop: Spacing.lg,
    color: Colors.textTertiary,
    fontSize: FontSize.lg,
  },
  returnBannerWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  returnBannerButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  returnBannerText: {
    color: Colors.primaryDark,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});
