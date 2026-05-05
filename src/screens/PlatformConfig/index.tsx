import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import { platformConfigApi } from '../../api/tenants';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';

export default function PlatformConfigScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);

  const loadData = async () => {
    try {
      const [platformsRes, overviewRes] = await Promise.all([
        platformConfigApi.getPlatforms(),
        platformConfigApi.getOverview(),
      ]);
      setPlatforms((platformsRes as any)?.data || platformsRes || []);
      setOverview((overviewRes as any)?.data || overviewRes);
    } catch (err: any) {
      console.error('加载平台配置失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="平台配置" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="平台配置" rightAction={{ icon: 'refresh', onPress: () => { setRefreshing(true); loadData(); } }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[Colors.primary]} />
        }
      >
        {/* 概览信息 */}
        {overview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>平台概览</Text>
            <View style={styles.overviewGrid}>
              <OverviewItem label="站点名称" value={overview.site_name || '-'} />
              <OverviewItem label="总用户数" value={String(overview.total_users || 0)} />
              <OverviewItem label="总设备数" value={String(overview.total_devices || 0)} />
              <OverviewItem label="总内容数" value={String(overview.total_threads || 0)} />
            </View>
          </View>
        )}

        {/* 平台列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>已配置平台</Text>
          {platforms.length === 0 ? (
            <Text style={styles.emptyText}>暂无平台配置</Text>
          ) : (
            platforms.map((platform: any, index: number) => (
              <View key={platform.id || index} style={styles.platformCard}>
                <View style={styles.platformHeader}>
                  <View style={styles.platformIcon}>
                    <Ionicons name="globe-outline" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.platformInfo}>
                    <Text style={styles.platformName}>{platform.name || platform.platform_name || '未命名'}</Text>
                    <Text style={styles.platformType}>{platform.type || platform.platform_type || '-'}</Text>
                  </View>
                  <View style={[
                    styles.platformStatus,
                    { backgroundColor: platform.is_active ? Colors.successBg : Colors.background }
                  ]}>
                    <Text style={[
                      styles.platformStatusText,
                      { color: platform.is_active ? Colors.success : Colors.textTertiary }
                    ]}>
                      {platform.is_active ? '已启用' : '已禁用'}
                    </Text>
                  </View>
                </View>
                {platform.description && (
                  <Text style={styles.platformDesc}>{platform.description}</Text>
                )}
                {platform.api_url && (
                  <View style={styles.platformMeta}>
                    <Text style={styles.metaLabel}>API:</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>{platform.api_url}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.overviewItem}>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: Spacing.lg },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  overviewItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  overviewValue: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  overviewLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  emptyText: { fontSize: FontSize.md, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.xxl },
  platformCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  platformHeader: { flexDirection: 'row', alignItems: 'center' },
  platformIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  platformInfo: { flex: 1 },
  platformName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  platformType: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  platformStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  platformStatusText: { fontSize: FontSize.xs, fontWeight: '600' },
  platformDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  platformMeta: { flexDirection: 'row', marginTop: Spacing.sm },
  metaLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, width: 30 },
  metaValue: { fontSize: FontSize.xs, color: Colors.textSecondary, flex: 1 },
});
