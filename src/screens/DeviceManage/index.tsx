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
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { deviceApi } from '../../api/device';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';

export default function DeviceManageScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [schema, setSchema] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ name: '', device_id: '', model: '', status: 'active' });
  const [submitting, setSubmitting] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res: any = await deviceApi.getDeviceList();
      setDevices(res?.data || res || []);
    } catch (err: any) {
      console.error('获取设备列表失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSchema = async () => {
    try {
      const res: any = await deviceApi.getSchema();
      setSchema(res?.data || res);
    } catch (e) { }
  };

  useEffect(() => {
    fetchDevices();
    fetchSchema();
  }, []);

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      Alert.alert('提示', '请填写设备名称');
      return;
    }
    setSubmitting(true);
    try {
      await deviceApi.createDevice(formData);
      Alert.alert('成功', '设备添加成功');
      setShowAddModal(false);
      setFormData({ name: '', device_id: '', model: '', status: 'active' });
      fetchDevices();
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || err.message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      active: { label: '在线', color: Colors.success, bg: Colors.successBg },
      inactive: { label: '离线', color: Colors.textTertiary, bg: Colors.background },
      maintenance: { label: '维护中', color: Colors.warning, bg: Colors.warningBg },
      error: { label: '异常', color: Colors.danger, bg: Colors.dangerBg },
    };
    return map[status] || map.inactive;
  };

  const renderDevice = ({ item }: { item: any }) => {
    const statusInfo = getStatusInfo(item.status || 'inactive');
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name="phone-portrait-outline" size={24} color={statusInfo.color} />
          </View>
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.name || '未命名设备'}</Text>
            <Text style={styles.deviceModel}>{item.model || item.device_id || '-'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>
        {item.device_id && (
          <View style={styles.cardMeta}>
            <Text style={styles.metaLabel}>设备ID:</Text>
            <Text style={styles.metaValue}>{item.device_id}</Text>
          </View>
        )}
        {item.last_active && (
          <View style={styles.cardMeta}>
            <Text style={styles.metaLabel}>最后活跃:</Text>
            <Text style={styles.metaValue}>
              {new Date(item.last_active).toLocaleString('zh-CN')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="设备管理"
        rightAction={{ icon: 'add-circle-outline', onPress: () => setShowAddModal(true) }}
      />

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDevices(); }} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? <EmptyState icon="phone-portrait-outline" title="暂无设备" message="点击右上角添加设备" /> : null
        }
      />

      {/* 添加设备弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加设备</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>设备名称 *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入设备名称"
                value={formData.name}
                onChangeText={(v) => setFormData({ ...formData, name: v })}
              />
              <Text style={styles.fieldLabel}>设备ID</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入设备ID"
                value={formData.device_id}
                onChangeText={(v) => setFormData({ ...formData, device_id: v })}
              />
              <Text style={styles.fieldLabel}>型号</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入设备型号"
                value={formData.model}
                onChangeText={(v) => setFormData({ ...formData, model: v })}
              />
              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                onPress={handleAdd}
                disabled={submitting}
              >
                <Text style={styles.submitButtonText}>
                  {submitting ? '提交中...' : '确认添加'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  deviceModel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', marginTop: Spacing.sm, paddingLeft: 56 },
  metaLabel: { fontSize: FontSize.sm, color: Colors.textTertiary, width: 70 },
  metaValue: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '600', color: Colors.text },
  modalBody: { padding: Spacing.lg },
  fieldLabel: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.md },
  fieldInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
  submitButtonText: { fontSize: FontSize.lg, fontWeight: '600', color: '#fff' },
});
