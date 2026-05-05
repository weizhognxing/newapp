import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Markdown from 'react-native-markdown-display';
import { threadsApi } from '../api/threads';
import { divergenceApi } from '../api/divergence';
import { platformConfigApi } from '../api/tenants';
import { authStore } from '../store/auth';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';
import { getThreadStatusText } from '../constants/config';
import EmptyState from './EmptyState';

interface ThreadListProps {
  statuses: number[];
  title: string;
  showApprove?: boolean;
  showPublish?: boolean;
  showDelete?: boolean;
  showEdit?: boolean;
  showArticlePreview?: boolean;
  statusTextMap?: Record<number, string>;
  dataSource?: 'threads' | 'divergence' | 'mixed';
}

type PickerMode = 'date' | 'time';

const IMAGE_URL_REGEX = /(https?:\/\/[^\s)]+\.(?:png|jpe?g|gif|webp))/gi;

const DIVERGENCE_STATUS_MAP: Record<string, number> = {
  pending_generate: 0,
  pending: 0,
  to_generate: 0,
  queued: 0,
  generating: 1,
  in_progress: 1,
  processing: 1,
  pending_review: 2,
  to_review: 2,
  review_pending: 2,
};

const parseDivergenceStatus = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return 0;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return numeric;
  return DIVERGENCE_STATUS_MAP[raw] ?? 0;
};

const normalizeDivergenceItem = (item: any) => {
  const id = item?.id ?? item?.divergence_id ?? item?.item_id ?? item?.topic_id ?? null;
  return {
    ...item,
    id,
    status: parseDivergenceStatus(item?.status),
    title: item?.title || item?.theme || item?.topic || '',
    content: item?.content || item?.article_content || item?.body || '',
    keywords: item?.keywords || item?.tags || '',
    created_at: item?.created_at || item?.create_time || item?.createdAt || null,
  };
};

const resolveDivergenceListPayload = (response: any) => {
  const rawList =
    (Array.isArray(response?.data) && response.data) ||
    (Array.isArray(response?.items) && response.items) ||
    (Array.isArray(response?.list) && response.list) ||
    (Array.isArray(response?.results) && response.results) ||
    (Array.isArray(response) && response) ||
    [];

  const total = Number(
    response?.total ?? response?.count ?? response?.pagination?.total ?? rawList.length
  );

  return {
    items: rawList.map(normalizeDivergenceItem),
    total: Number.isFinite(total) ? total : rawList.length,
  };
};

const extractImageUrls = (raw: string) => {
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

  const plainMatches = raw.matchAll(IMAGE_URL_REGEX);
  for (const match of plainMatches) {
    if (match[1]) urls.add(match[1]);
  }

  return Array.from(urls);
};

export default function ThreadList({
  statuses,
  title,
  showApprove,
  showPublish,
  showDelete,
  showEdit,
  showArticlePreview,
  statusTextMap,
  dataSource = 'threads',
}: ThreadListProps) {
  const navigation = useNavigation<any>();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<number[]>([]);
  const [publishAt, setPublishAt] = useState<Date | null>(null);
  const [useImmediatePublish, setUseImmediatePublish] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>('date');
  const [tempPublishDate, setTempPublishDate] = useState<Date>(new Date(Date.now() + 10 * 60000));
  const [publishing, setPublishing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentThread, setCurrentThread] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [republishPlatformIds, setRepublishPlatformIds] = useState<number[]>([]);
  const [republishPlatformNames, setRepublishPlatformNames] = useState<string[]>([]);

  const PAGE_SIZE = 20;
  const AUTO_REFRESH_INTERVAL = 60000;

  const activePlatforms = useMemo(
    () => platforms.filter((item) => item?.is_active !== false),
    [platforms]
  );
  const generationMode = dataSource === 'divergence';
  const mixedMode = dataSource === 'mixed';
  const publishListMode = Boolean(showPublish && !showEdit);

  const loadPlatforms = useCallback(async () => {
    try {
      const response: any = await platformConfigApi.getPlatforms();
      const list = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      setPlatforms(list);
    } catch (err) {
      setPlatforms([]);
    }
  }, []);

  const fetchThreads = useCallback(async (reset = false) => {
    if (loading) return;
    const currentPage = reset ? 0 : page;
    setLoading(true);
    try {
      const tenantId = authStore.getEffectiveTenantId();
      if (!tenantId) return;

      let items: any[] = [];
      let totalCount = 0;
      let rawCount = 0;

      if (mixedMode) {
        const [divergenceResp, threadsResp] = await Promise.all([
          divergenceApi.getDivergenceList({
            tenant_id: tenantId,
            page: currentPage + 1,
            page_size: PAGE_SIZE,
          }),
          threadsApi.getThreads(tenantId, currentPage * PAGE_SIZE, PAGE_SIZE, null, null, [0]),
        ]);

        const normalized = resolveDivergenceListPayload(divergenceResp);
        const divergenceItems = normalized.items
          .filter((item: any) => [0, 1].includes(item.status))
          .map((item: any) => ({ ...item, source_type: 'divergence' }));

        const rawThreadData = threadsResp?.data || [];
        const threadItems = (Array.isArray(rawThreadData) ? rawThreadData : [])
          .map((item: any) => ({ ...item, source_type: 'threads' }));

        items = [...divergenceItems, ...threadItems].sort((a: any, b: any) => {
          const ta = new Date(a?.created_at || a?.create_time || a?.createdAt || 0).getTime();
          const tb = new Date(b?.created_at || b?.create_time || b?.createdAt || 0).getTime();
          return tb - ta;
        });

        const threadsTotal = (threadsResp as any)?.total ?? (threadsResp as any)?.data?.total ?? (Array.isArray(rawThreadData) ? rawThreadData.length : 0);
        totalCount = Number(normalized.total || 0) + Number(threadsTotal || 0);
        rawCount = normalized.items.length + (Array.isArray(rawThreadData) ? rawThreadData.length : 0);
      } else if (generationMode) {
        const response: any = await divergenceApi.getDivergenceList({
          tenant_id: tenantId,
          page: currentPage + 1,
          page_size: PAGE_SIZE,
        });
        const normalized = resolveDivergenceListPayload(response);
        rawCount = normalized.items.length;
        items = normalized.items.filter((item: any) =>
          statuses.length ? statuses.includes(item.status) : [0, 1, 2].includes(item.status)
        );
        totalCount = normalized.total;
      } else {
        const response: any = await threadsApi.getThreads(
          tenantId,
          currentPage * PAGE_SIZE,
          PAGE_SIZE,
          null,
          null,
          statuses
        );

        const data = response?.data || [];
        const rawItems = Array.isArray(data) ? data : [];
        rawCount = rawItems.length;
        items = publishListMode
          ? rawItems.filter((item: any) => [4, 5, 7].includes(Number(item?.status)))
          : rawItems;
        totalCount = Number(response?.total || 0);
      }

      const nextPage = currentPage + 1;

      if (reset) {
        setThreads(items);
        setPage(1);
      } else {
        setThreads((prev) => [...prev, ...items]);
        setPage(nextPage);
      }
      setTotal(totalCount);
      setHasMore(mixedMode ? rawCount >= PAGE_SIZE : generationMode ? rawCount >= PAGE_SIZE : nextPage * PAGE_SIZE < totalCount);
    } catch (err: any) {
      console.error('获取列表失败:', err);
    } finally {
      setLoadedOnce(true);
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, statuses, loading, dataSource, generationMode, mixedMode, publishListMode]);

  useEffect(() => {
    fetchThreads(true);
  }, [statuses]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchThreads(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      clearInterval(timer);
    };
  }, [fetchThreads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchThreads(true);
  };

  const onEndReached = () => {
    if (hasMore && !loading) fetchThreads(false);
  };

  const handleDelete = async (threadId: number, sourceType?: 'threads' | 'divergence') => {
    Alert.alert('确认删除', '删除后不可恢复，确定要删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const tenantId = authStore.getEffectiveTenantId();
            if (!tenantId) return;
            const useDivergence = sourceType === 'divergence' || generationMode;
            if (useDivergence) {
              await divergenceApi.deleteDivergence(threadId);
            } else {
              await threadsApi.deleteThread(threadId, tenantId);
            }
            Alert.alert('成功', '已删除');
            fetchThreads(true);
          } catch (err: any) {
            Alert.alert('错误', err.message || '删除失败');
          }
        },
      },
    ]);
  };

  const handleApproveOnly = async (threadId: number) => {
    Alert.alert('确认', '确定要审核通过该内容吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            const tenantId = authStore.getEffectiveTenantId();
            if (!tenantId) return;
            await threadsApi.approveThreadStatus(threadId, tenantId);
            Alert.alert('成功', '审核已通过');
            fetchThreads(true);
          } catch (err: any) {
            Alert.alert('错误', err.message || '操作失败');
          }
        },
      },
    ]);
  };

  const closePublishModal = () => {
    if (publishing) return;
    setPublishModalVisible(false);
    setCurrentThread(null);
    setSelectedPlatformIds([]);
    setRepublishPlatformIds([]);
    setRepublishPlatformNames([]);
    setPublishAt(null);
    setUseImmediatePublish(true);
    setPickerVisible(false);
    setPickerMode('date');
    setTempPublishDate(new Date(Date.now() + 10 * 60000));
  };

  const openPublishModal = async (thread: any) => {
    setCurrentThread(thread);
    setPublishAt(null);
    setUseImmediatePublish(true);
    setPickerVisible(false);
    setPickerMode('date');
    setTempPublishDate(new Date(Date.now() + 10 * 60000));
    setRepublishPlatformIds([]);
    setRepublishPlatformNames([]);
    setSelectedPlatformIds([]);
    await loadPlatforms();
    setPublishModalVisible(true);
  };

  const openRepublishModal = async (thread: any) => {
    try {
      const tenantId = authStore.getEffectiveTenantId();
      if (!tenantId) return;

      const response: any = await threadsApi.getThreadPublishRecords(thread.id, tenantId);
      const records = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      const failedRecords = records.filter((item: any) => Number(item?.status) === 3);

      if (!failedRecords.length) {
        Alert.alert('提示', '该文章没有可重新发布的失败平台');
        return;
      }

      const platformIds = failedRecords.map((item: any) => Number(item.platform_id)).filter((id: number) => Number.isFinite(id));
      const platformNames = failedRecords.map((item: any) => item.platform_name || `平台${item.platform_id}`);

      setCurrentThread(thread);
      setPublishAt(null);
      setUseImmediatePublish(true);
      setPickerVisible(false);
      setPickerMode('date');
      setTempPublishDate(new Date(Date.now() + 10 * 60000));
      setRepublishPlatformIds(platformIds);
      setRepublishPlatformNames(platformNames);
      setSelectedPlatformIds(platformIds);
      setPublishModalVisible(true);
    } catch (err: any) {
      Alert.alert('错误', err?.response?.data?.detail || err?.message || '加载失败平台失败');
    }
  };

  const togglePlatform = (platformId: number) => {
    setSelectedPlatformIds((prev) => {
      if (prev.includes(platformId)) {
        return prev.filter((id) => id !== platformId);
      }
      return [...prev, platformId];
    });
  };

  const submitPublish = async ({ withEditSave = false }: { withEditSave?: boolean } = {}) => {
    if (!currentThread) return;
    const targetPlatformIds = republishPlatformIds.length ? republishPlatformIds : selectedPlatformIds;
    if (!targetPlatformIds.length) {
      Alert.alert('提示', '请先选择发布平台');
      return;
    }

    setPublishing(true);
    try {
      const tenantId = authStore.getEffectiveTenantId();
      if (!tenantId) throw new Error('租户信息缺失，请重新登录');

      if (!useImmediatePublish) {
        if (!publishAt) {
          throw new Error('请先选择发布时间');
        }
        if (publishAt.getTime() < Date.now()) {
          throw new Error('发布时间不能早于当前时间');
        }
      }

      if (withEditSave) {
        setEditing(true);
        await threadsApi.updateArticle(currentThread.id, {
          title: editTitle.trim(),
          content: editContent,
          article_type: currentThread.article_type || null,
        });
      }

      if (!republishPlatformIds.length) {
        await threadsApi.approveThreadStatus(currentThread.id, tenantId);
      }

      const publishAtISO = useImmediatePublish ? null : (publishAt as Date).toISOString();
      const schedules = targetPlatformIds.map((platformId) => ({
        platform_id: platformId,
        publish_at: publishAtISO,
      }));

      await threadsApi.updateThreadStatus(currentThread.id, tenantId, targetPlatformIds, schedules);
      Alert.alert('成功', '已提交发布任务');
      setPublishModalVisible(false);
      setEditModalVisible(false);
      setCurrentThread(null);
      fetchThreads(true);
    } catch (err: any) {
      Alert.alert('错误', err?.response?.data?.detail || err?.message || '发布失败');
    } finally {
      setEditing(false);
      setPublishing(false);
    }
  };

  const openEditModal = (thread: any) => {
    setCurrentThread(thread);
    setEditTitle(thread?.title || thread?.theme || '');
    setEditContent(thread?.content || '');
    setEditModalVisible(true);
  };

  const openPublishFromEdit = async () => {
    if (!currentThread) return;
    if (!editTitle.trim()) {
      Alert.alert('提示', '标题不能为空');
      return;
    }
    if (!editContent.trim()) {
      Alert.alert('提示', '正文不能为空');
      return;
    }

    await loadPlatforms();
    setPublishAt(null);
    setUseImmediatePublish(true);
    setPickerVisible(false);
    setPickerMode('date');
    setTempPublishDate(new Date(Date.now() + 10 * 60000));
    setRepublishPlatformIds([]);
    setRepublishPlatformNames([]);
    setSelectedPlatformIds([]);
    setPublishModalVisible(true);
  };

  const showDateTimePicker = () => {
    setUseImmediatePublish(false);
    setPickerMode('date');
    setPickerVisible(true);
  };

  const onChangePublishTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setPickerVisible(false);
      return;
    }

    const picked = selectedDate || tempPublishDate;
    if (pickerMode === 'date') {
      const merged = new Date(picked);
      const current = publishAt || tempPublishDate;
      merged.setHours(current.getHours(), current.getMinutes(), 0, 0);
      setTempPublishDate(merged);
      setPickerMode('time');
      return;
    }

    const merged = new Date(tempPublishDate);
    merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    setPublishAt(merged);
    setTempPublishDate(merged);
    setPickerVisible(false);
  };

  const viewDetail = async (thread: any) => {
    const itemDataSource = thread?.source_type === 'divergence' ? 'divergence' : 'threads';
    navigation.navigate('ThreadDetail', {
      threadId: itemDataSource === 'divergence' ? undefined : thread.id,
      thread,
      dataSource: itemDataSource,
    });
  };

  const statusTextForItem = (item: any) => {
    if (mixedMode) {
      if (item?.source_type === 'divergence') {
        if (item?.status === 0) return '待生成';
        if (item?.status === 1) return '生成中';
      }
      if (item?.source_type === 'threads' && item?.status === 0) {
        return '待审核';
      }
    }
    if (statusTextMap && statusTextMap[item?.status]) return statusTextMap[item.status];
    return getThreadStatusText(item?.status ?? 0);
  };

  const resolveArticleUrl = (thread: any): string => {
    return (
      thread?.url ||
      thread?.article_url ||
      thread?.publish_url ||
      thread?.link ||
      thread?.jump_url ||
      ''
    );
  };

  const openArticleLink = async (thread: any) => {
    const url = String(resolveArticleUrl(thread) || '').trim();
    if (!url) {
      Alert.alert('提示', '该文章暂无可访问链接');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('提示', '当前链接无法在浏览器打开');
        return;
      }
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert('错误', err?.message || '打开链接失败');
    }
  };

  const getStatusColor = (status: number) => {
    const colors: Record<number, string> = {
      0: Colors.warning,
      1: Colors.success,
      2: Colors.info,
      3: Colors.primary,
      4: Colors.primary,
      5: Colors.success,
      7: Colors.danger,
    };
    return colors[status] || Colors.textSecondary;
  };

  const renderThread = ({ item }: { item: any }) => {
    const status = item.status ?? 0;
    const isDivergenceItem = mixedMode ? item?.source_type === 'divergence' : generationMode;
    const canDelete = Boolean(showDelete && (isDivergenceItem ? (status === 0 || status === 2) : true));
    const canApprove = Boolean(showApprove && status === 0);
    const canEdit = Boolean(generationMode && showEdit && status === 0);
    const canRepublish = Boolean(publishListMode && status === 7);
    const canOpenPublishedLink = Boolean(publishListMode && status === 5);

    const rawContent = String(item?.content || '');
    const previewImageUrls = extractImageUrls(rawContent).slice(0, 2);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => viewDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(status) }]}> 
              {statusTextForItem(item)}
            </Text>
          </View>
          {mixedMode ? (
            <View style={[styles.statusBadge, styles.typeBadge]}>
              <Text style={[styles.statusText, styles.typeBadgeText]}>
                {item?.source_type === 'divergence' ? '选题' : '文章'}
              </Text>
            </View>
          ) : null}
          <Text style={styles.cardDate}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : ''}
          </Text>
        </View>

        {canOpenPublishedLink ? (
          <TouchableOpacity onPress={() => openArticleLink(item)}>
            <Text style={[styles.cardTitle, styles.cardTitleLink]} numberOfLines={2}>
              {item.title || item.theme || '未命名内容'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || item.theme || '未命名内容'}
          </Text>
        )}

        {publishListMode && status === 5 ? (
          <Text style={styles.readCountText}>阅览量：{Number(item?.view_count || 0)}</Text>
        ) : null}

        {previewImageUrls.length ? (
          <View style={styles.imageRow}>
            {previewImageUrls.map((url, index) => (
              <Image key={`${url}-${index}`} source={{ uri: url }} style={styles.previewImage} resizeMode="cover" />
            ))}
          </View>
        ) : null}

        {rawContent ? (
          (generationMode && status === 0) || (!generationMode && showArticlePreview && status === 0) ? (
            <View style={styles.markdownWrap}>
              <Markdown style={markdownStyles}>{rawContent}</Markdown>
            </View>
          ) : (
            <Text style={styles.cardContent} numberOfLines={3}>
              {rawContent}
            </Text>
          )
        ) : null}

        {item.keywords && (
          <View style={styles.tagsRow}>
            {String(item.keywords).split(/[,，、]+/).filter(Boolean).slice(0, 3).map((kw: string, i: number) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{kw.trim()}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.cardActions}>
          {canEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => openEditModal(item)}
            >
              <Ionicons name="create-outline" size={16} color={Colors.primaryDark} />
              <Text style={[styles.actionText, { color: Colors.primaryDark }]}>编辑</Text>
            </TouchableOpacity>
          )}
          {canApprove && (
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => (isDivergenceItem ? openPublishModal(item) : handleApproveOnly(item.id))}
            >
              <Ionicons name="checkmark" size={16} color={Colors.success} />
              <Text style={[styles.actionText, { color: Colors.success }]}>通过</Text>
            </TouchableOpacity>
          )}
          {canDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => {
                if (!item?.id) {
                  Alert.alert('提示', '当前记录缺少标识，暂时无法删除');
                  return;
                }
                handleDelete(item.id, item?.source_type);
              }}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
              <Text style={[styles.actionText, { color: Colors.danger }]}>删除</Text>
            </TouchableOpacity>
          )}
          {canRepublish && (
            <TouchableOpacity
              style={[styles.actionButton, styles.republishButton]}
              onPress={() => openRepublishModal(item)}
            >
              <Ionicons name="refresh" size={16} color={Colors.primaryDark} />
              <Text style={[styles.actionText, { color: Colors.primaryDark }]}>重新发布</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerCount}>共 {total} 条</Text>
      </View>

      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={(item, index) => String(item?.id ?? `fallback-${index}`)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loadedOnce && threads.length === 0 ? <EmptyState icon="document-text-outline" title="暂无内容" /> : null
        }
        ListFooterComponent={
          loading && threads.length > 0 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : null
        }
      />

      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>编辑待审核文章</Text>
            <Text style={styles.modalLabel}>标题</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              style={styles.input}
              placeholder="请输入文章标题"
              placeholderTextColor={Colors.textTertiary}
            />
            <Text style={styles.modalLabel}>正文</Text>
            <TextInput
              value={editContent}
              onChangeText={setEditContent}
              style={[styles.input, styles.contentInput]}
              multiline
              placeholder="请输入文章内容"
              placeholderTextColor={Colors.textTertiary}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary, editing && styles.modalPrimaryDisabled]}
                onPress={openPublishFromEdit}
                disabled={editing}
              >
                <Text style={styles.modalPrimaryText}>{editing ? '保存中...' : '保存并发布'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={publishModalVisible} transparent animationType="fade" onRequestClose={closePublishModal}>
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{republishPlatformIds.length ? '重新发布' : '确认发布'}</Text>
            <Text style={styles.modalLabel}>选择发布时间</Text>
            <View style={styles.timeRow}>
              <TouchableOpacity
                style={[styles.timeChip, useImmediatePublish && styles.timeChipActive]}
                onPress={() => {
                  setUseImmediatePublish(true);
                  setPublishAt(null);
                }}
              >
                <Text style={[styles.timeChipText, useImmediatePublish && styles.timeChipTextActive]}>立即发布</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timeChip, !useImmediatePublish && styles.timeChipActive]}
                onPress={showDateTimePicker}
              >
                <Text style={[styles.timeChipText, !useImmediatePublish && styles.timeChipTextActive]}>定时发布</Text>
              </TouchableOpacity>
            </View>
            {!useImmediatePublish ? (
              <TouchableOpacity style={styles.schedulePickerButton} onPress={showDateTimePicker}>
                <Ionicons name="calendar-outline" size={16} color={Colors.primaryDark} />
                <Text style={styles.schedulePickerButtonText}>
                  {publishAt ? `发布时间：${publishAt.toLocaleString('zh-CN', { hour12: false })}` : '请选择年月日时分'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {!useImmediatePublish && publishAt && publishAt.getTime() < Date.now() ? (
              <Text style={styles.timeErrorText}>发布时间不能早于当前时间</Text>
            ) : null}

            {pickerVisible ? (
              <DateTimePicker
                value={publishAt || tempPublishDate}
                mode={pickerMode}
                display="default"
                minimumDate={new Date()}
                onChange={onChangePublishTime}
                is24Hour
              />
            ) : null}

            {republishPlatformIds.length ? (
              <View style={styles.republishInfoCard}>
                <Text style={styles.modalLabel}>失败平台</Text>
                <Text style={styles.republishInfoText}>{republishPlatformNames.join('、')}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalLabel}>选择发布平台</Text>
                <ScrollView style={styles.platformScroll} contentContainerStyle={styles.platformWrap}>
                  {activePlatforms.map((platform) => {
                    const platformId = Number(platform.id);
                    const selected = selectedPlatformIds.includes(platformId);
                    return (
                      <TouchableOpacity
                        key={String(platform.id)}
                        style={[styles.platformChip, selected && styles.platformChipActive]}
                        onPress={() => togglePlatform(platformId)}
                      >
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={16}
                          color={selected ? Colors.primary : Colors.textTertiary}
                        />
                        <Text style={[styles.platformChipText, selected && styles.platformChipTextActive]}>
                          {platform.name || platform.platform_name || `平台${platform.id}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {!activePlatforms.length ? <Text style={styles.helperText}>暂无可用发布平台</Text> : null}
                </ScrollView>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalCancel]} onPress={closePublishModal} disabled={publishing}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalPrimary, publishing && styles.modalPrimaryDisabled]}
                onPress={() => submitPublish({ withEditSave: editModalVisible })}
                disabled={publishing}
              >
                <Text style={styles.modalPrimaryText}>{publishing ? '提交中...' : '确认发布'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  headerCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    paddingBottom: 100,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: Colors.infoBg,
    marginLeft: Spacing.xs,
  },
  typeBadgeText: {
    color: Colors.info,
  },
  cardDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
    lineHeight: 24,
  },
  cardTitleLink: {
    color: Colors.primaryDark,
    textDecorationLine: 'underline',
  },
  readCountText: {
    marginBottom: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  cardContent: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  markdownWrap: {
    marginBottom: Spacing.sm,
    maxHeight: 170,
    overflow: 'hidden',
  },
  imageRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  previewImage: {
    flex: 1,
    height: 100,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  editButton: {
    backgroundColor: Colors.infoBg,
  },
  approveButton: {
    backgroundColor: Colors.successBg,
  },
  deleteButton: {
    backgroundColor: Colors.dangerBg,
  },
  republishButton: {
    backgroundColor: Colors.infoBg,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  loadingFooter: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.35)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    maxHeight: '85%',
    ...Shadow.lg,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  modalLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
  },
  contentInput: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  timeChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  timeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  timeChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  timeChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  schedulePickerButton: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  schedulePickerButtonText: {
    color: Colors.primaryDark,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  timeErrorText: {
    marginBottom: Spacing.sm,
    color: Colors.danger,
    fontSize: FontSize.xs,
  },
  platformScroll: {
    maxHeight: 180,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  platformWrap: {
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  platformChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  platformChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  platformChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  helperText: {
    color: Colors.textTertiary,
    fontSize: FontSize.sm,
  },
  republishInfoCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    padding: Spacing.sm,
  },
  republishInfoText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  modalActions: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  modalButton: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  modalCancel: {
    backgroundColor: Colors.background,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  modalPrimary: {
    backgroundColor: Colors.primary,
  },
  modalPrimaryDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  modalPrimaryText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
});

const markdownStyles: any = {
  body: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 20,
  },
  heading1: {
    color: Colors.text,
    fontSize: FontSize.lg,
    marginBottom: Spacing.xs,
  },
  heading2: {
    color: Colors.text,
    fontSize: FontSize.md,
    marginBottom: Spacing.xs,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: Spacing.xs,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
};
