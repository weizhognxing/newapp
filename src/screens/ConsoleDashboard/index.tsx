import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../../components/PageHeader';
import { platformConfigApi } from '../../api/tenants';
import { companyApi } from '../../api/company';
import { authStore } from '../../store/auth';
import { Colors, Spacing, FontSize, BorderRadius, Gradients, Shadow } from '../../constants/theme';

export default function ConsoleDashboardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [overviewRes, companiesRes] = await Promise.all([
        platformConfigApi.getOverview(),
        companyApi.getDirectory(),
      ]);
      setOverview((overviewRes as any)?.data || overviewRes);
      setCompanies((companiesRes as any)?.data || companiesRes || []);
    } catch (err: any) {
      console.error('加载控制台数据失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSwitchTenant = async (tenantId: number, tenantName: string) => {
    try {
      const { switchTenant } = require('../../api/auth').authApi;
      await switchTenant(tenantId);
      await authStore.setImpersonatedTenantId(tenantId);
    } catch (err: any) {
      console.error('切换租户失败:', err);
    }
  };

  const statCards = [
    { icon: 'business', label: '公司总数', value: companies.length, color: Colors.primary, bg: Colors.primaryBg },
    { icon: 'people', label: '用户总数', value: overview?.total_users || 0, color: Colors.success, bg: Colors.successBg },
    { icon: 'phone-portrait', label: '设备总数', value: overview?.total_devices || 0, color: Colors.warning, bg: Colors.warningBg },
    { icon: 'document-text', label: '内容总数', value: overview?.total_threads || 0, color: Colors.info, bg: Colors.infoBg },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="控制台" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader
        title="控制台"
        subtitle="平台管理"
        rightComponent={
          authStore.isImpersonated() ? (
            <TouchableOpacity
              style={styles.restoreBtn}
              onPress={async () => {
                const { restoreRealIdentity } = require('../../api/auth').authApi;
                await restoreRealIdentity();
                await authStore.setImpersonatedTenantId(null);
              }}
            >
              <Ionicons name="arrow-undo" size={16} color={Colors.warning} />
              <Text style={styles.restoreBtnText}>恢复身份</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[Colors.primary]} />
        }
      >
        <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dashboardHero}>
          <View style={styles.dashboardGlow} />
          <Text style={styles.heroEyebrow}>PLATFORM INSIGHT</Text>
          <Text style={styles.heroTitle}>增长数据驾驶舱</Text>
          <Text style={styles.heroDesc}>实时掌握公司、用户、设备与内容资产的运营状态。</Text>
        </LinearGradient>

        {/* 统计卡片 */}
        <View style={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <View key={index} style={[styles.statCard, { backgroundColor: stat.bg }]}>
              <Ionicons name={stat.icon as any} size={28} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* 快捷操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快捷操作</Text>
          <View style={styles.quickActions}>
            <QuickAction
              icon="business-outline"
              label="公司管理"
              onPress={() => navigation.navigate('CompanyManageMain')}
            />
            <QuickAction
              icon="settings-outline"
              label="平台配置"
              onPress={() => navigation.navigate('PlatformConfigMain')}
            />
            <QuickAction
              icon="construct-outline"
              label="设备维护"
              onPress={() => navigation.navigate('DeviceMaintenanceMain')}
            />
          </View>
        </View>

        {/* 公司列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>公司列表</Text>
          {companies.map((company: any) => (
            <TouchableOpacity
              key={company.id}
              style={styles.companyCard}
              onPress={() => handleSwitchTenant(company.id, company.name)}
            >
              <View style={styles.companyLeft}>
                <View style={styles.companyAvatar}>
                  <Text style={styles.companyAvatarText}>
                    {(company.name || '?')[0]}
                  </Text>
                </View>
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{company.name || company.fullname || '未命名'}</Text>
                  <Text style={styles.companyIndustry}>{company.industry || '-'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon as any} size={24} color={Colors.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 110 },
  dashboardHero: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadow.brand,
  },
  dashboardGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -48,
    top: -64,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: Colors.textInverse,
    fontSize: FontSize.xxxl,
    fontWeight: '900',
    marginTop: Spacing.xs,
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  restoreBtnText: { fontSize: FontSize.sm, color: Colors.warning, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    ...Shadow.md,
  },
  statValue: { fontSize: FontSize.xxxl, fontWeight: '900', marginTop: Spacing.sm },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.md,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text, marginBottom: Spacing.lg },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '700' },
  companyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  companyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  companyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  companyAvatarText: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.primary },
  companyInfo: { flex: 1 },
  companyName: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text },
  companyIndustry: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
});
