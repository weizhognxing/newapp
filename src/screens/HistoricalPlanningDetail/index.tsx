import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import PageHeader from '../../components/PageHeader';
import BottomActionBar from '../../components/BottomActionBar';
import EmptyState from '../../components/EmptyState';
import { historicalPlanningApi } from '../../api/historicalPlanning';
import { divergenceApi } from '../../api/divergence';
import { authStore } from '../../store/auth';
import { BorderRadius, Colors, FontSize, Shadow, Spacing } from '../../constants/theme';

interface HistoricalItem {
  id: number;
  theme: string;
  content: string;
  keywords?: string;
}

export default function HistoricalPlanningDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const planningSessionId = String(route.params?.planningSessionId || '');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [items, setItems] = useState<HistoricalItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const fetchDetail = useCallback(async () => {
    if (!planningSessionId) return;
    const tenantId = authStore.getEffectiveTenantId();
    if (!tenantId) return;

    setLoading(true);
    try {
      const response: any = await historicalPlanningApi.getHistoricalPlanningSessionDetail(
        planningSessionId,
        { tenant_id: tenantId }
      );
      const list = Array.isArray(response?.data) ? response.data : [];
      setSession(response?.session || null);
      setItems(list);
      setSelectedIds(new Set());
    } catch (error: any) {
      Alert.alert('加载失败', error?.response?.data?.detail || error?.message || '获取历史选题详情失败');
    } finally {
      setLoading(false);
    }
  }, [planningSessionId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const selectedCount = selectedIds.size;

  const toggleSelect = (itemId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(Number(item.id))),
    [items, selectedIds]
  );

  const handleSubmit = async () => {
    if (!selectedItems.length) {
      Alert.alert('提示', '请至少选择 1 条选题');
      return;
    }

    const tenantId = authStore.getEffectiveTenantId();
    const userId = authStore.getUser()?.id;
    if (!tenantId || !userId) {
      Alert.alert('错误', '登录信息缺失，请重新登录');
      return;
    }

    setSubmitting(true);
    try {
      await divergenceApi.saveDivergence({
        tenant_id: tenantId,
        user_id: userId,
        status: 0,
        items: selectedItems.map((item) => ({
          theme: item.theme,
          content: item.content,
          keywords: item.keywords || '',
        })),
        note: '',
        source_topics: JSON.stringify(session?.source_topics || []),
        account_type_id: session?.account_type_id || null,
        account_id: session?.account_id || null,
        article_type: session?.article_type || null,
      });

      Alert.alert('成功', `已保存 ${selectedItems.length} 条到生成列表`);
      navigation.navigate('GenerationListTab');
    } catch (error: any) {
      Alert.alert('提交失败', error?.response?.data?.detail || error?.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: HistoricalItem }) => {
    const selected = selectedIds.has(Number(item.id));
    return (
      <TouchableOpacity style={[styles.card, selected && styles.cardSelected]} onPress={() => toggleSelect(Number(item.id))}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.theme}</Text>
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={selected ? Colors.primary : Colors.textTertiary}
          />
        </View>
        <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
        {!!item.keywords ? <Text style={styles.keywordText}>关键词：{item.keywords}</Text> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="历史选题详情" onBack={() => navigation.goBack()} />

      {session ? (
        <View style={styles.sessionCard}>
          <Text style={styles.sessionTitle} numberOfLines={2}>{session?.title || '历史选题批次'}</Text>
          <Text style={styles.sessionQuery} numberOfLines={3}>{session?.query || '-'}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 160 + tabBarHeight }}
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="暂无历史选题结果" />}
        />
      )}

      <BottomActionBar
        summary={`已选 ${selectedCount} / ${items.length} 条`}
        primaryLabel={submitting ? '提交中...' : '提交到生成列表'}
        onPrimaryPress={handleSubmit}
        disabled={submitting || selectedCount === 0}
        secondaryLabel="返回"
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  sessionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    lineHeight: 22,
  },
  sessionQuery: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  card: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardContent: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  keywordText: {
    marginTop: Spacing.xs,
    color: Colors.primaryDark,
    fontSize: FontSize.xs,
  },
});
