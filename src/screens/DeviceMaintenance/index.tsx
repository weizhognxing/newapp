import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { deviceApi, deviceMaintenanceApi } from '../../api/device';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';

export default function DeviceMaintenanceScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res: any = await deviceApi.getPlatformMaintenanceDevices();
      setDevices(res?.data || res || []);
    } catch (err: any) {
      console.error('获取维护设备失败:', err);
      // 尝试备用接口
      try {
        const res2: any = await deviceMaintenanceApi.getMaintenanceList();
        setDevices(res2?.data || res2 || []);
      } catch (e) { }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRestore = (deviceId: number, deviceName: string) => {
    Alert.alert('确认恢复', `确定要将设备 "${deviceName}" 恢复正常吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            await deviceMaintenanceApi.restoreNormal(deviceId);
            Alert.alert('成功', '设备已恢复正常');
            fetchDevices();
          } catch (err: any) {
            Alert.alert('错误', err.message || '恢复失败');
          }
        },
      },
    ]);
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string; icon: string }> = {
      maintenance: { label: '维护中', color: Colors.warning, bg: Colors.warningBg, icon: 'construct' },
      error: { label: '异常', color: Colors.danger, bg: Colors.dangerBg, icon: 'alert-circle' },
      offline: { label: '离线', color: Colors.textTertiary, bg: Colors.background, icon: 'cloud-offline' },
    };
    return map[status] || { label: status || '未知', color: Colors.textTertiary, bg: Colors.background, icon: 'help-circle' };
  };

  const renderDevice = ({ item }: { item: any }) => {
    const statusInfo = getStatusInfo(item.status || 'maintenance');
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon as any} size={24} color={statusInfo.color} />
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.name || '未命名设备'}</Text>
            <Text style={styles.deviceId}>{item.device_id || `ID: ${item.id}`}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        {item.tenant_name && (
          <View style={styles.metaRow}>
            <Ionicons name="business-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.metaText}>所属公司: {item.tenant_name}</Text>
          </View>
        )}

        {item.error_message && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={14} color={Colors.danger} />
            <Text style={styles.errorText}>{item.error_message}</Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => handleRestore(item.id, item.name || '该设备')}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
            <Text style={styles.restoreButtonText}>恢复正常</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="设备维护" subtitle="平台维护设备列表" />

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDevices(); }} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="暂无需要维护的设备"
              message="所有设备运行正常"
            />
          ) : null
        }
      />

      {loading && devices.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  deviceId: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    paddingLeft: 56,
  },
  metaText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.danger, flex: 1 },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  restoreButtonText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.success },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
});
