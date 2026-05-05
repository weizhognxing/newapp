import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import { companyApi } from '../../api/company';
import { platformConfigApi } from '../../api/tenants';
import { authStore } from '../../store/auth';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';

export default function CompanyInfoScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const tenantId = authStore.getEffectiveTenantId();
      if (!tenantId) return;

      const [companyRes, overviewRes] = await Promise.all([
        companyApi.getTenantDetail(tenantId),
        platformConfigApi.getOverview(),
      ]);

      setCompanyData((companyRes as any)?.data || companyRes);
      setOverview((overviewRes as any)?.data || overviewRes);
    } catch (err: any) {
      console.error('加载公司信息失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="公司信息" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="公司信息" rightAction={{ icon: 'refresh', onPress: loadData }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 公司Logo和名称 */}
        <View style={styles.profileCard}>
          <View style={styles.logoContainer}>
            {companyData?.logo_url ? (
              <Image source={{ uri: companyData.logo_url }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="business" size={40} color={Colors.textTertiary} />
              </View>
            )}
          </View>
          <Text style={styles.companyName}>{companyData?.fullname || companyData?.name || '未设置'}</Text>
          <Text style={styles.companyId}>租户ID: {companyData?.id || '-'}</Text>
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <InfoRow label="公司全称" value={companyData?.fullname} />
          <InfoRow label="简称" value={companyData?.name} />
          <InfoRow label="行业" value={companyData?.industry} />
          <InfoRow label="联系人" value={companyData?.contact_name} />
          <InfoRow label="联系电话" value={companyData?.contact_phone} />
          <InfoRow label="地址" value={companyData?.address} />
          <InfoRow label="创建时间" value={companyData?.created_at ? new Date(companyData.created_at).toLocaleDateString('zh-CN') : '-'} />
        </View>

        {/* 平台概览 */}
        {overview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>平台概览</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon="people"
                label="人员数"
                value={overview?.personnel_count || overview?.users?.length || 0}
                color={Colors.primary}
              />
              <StatCard
                icon="phone-portrait"
                label="设备数"
                value={overview?.device_count || 0}
                color={Colors.success}
              />
              <StatCard
                icon="person-circle"
                label="账号数"
                value={overview?.account_count || 0}
                color={Colors.warning}
              />
              <StatCard
                icon="document-text"
                label="内容数"
                value={overview?.thread_count || 0}
                color={Colors.info}
              />
            </View>
          </View>
        )}

        {/* 站点配置 */}
        {overview?.site_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>站点配置</Text>
            <InfoRow label="站点名称" value={overview.site_name} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '-'}</Text>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  logoContainer: {
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
  },
  companyId: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
