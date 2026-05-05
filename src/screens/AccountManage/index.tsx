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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import { accountApi } from '../../api/account';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';

export default function AccountManageScreen() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [accountTypes, setAccountTypes] = useState<any[]>([]);
  const [formOptions, setFormOptions] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    account_type_id: null,
    username: '',
    password: '',
    platform_name: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res: any = await accountApi.getAccountList();
      setAccounts(res?.data || res || []);
    } catch (err: any) {
      console.error('获取账号列表失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [typesRes, optionsRes] = await Promise.all([
        accountApi.getAccountTypes(),
        accountApi.getFormOptions(),
      ]);
      setAccountTypes((typesRes as any)?.data || typesRes || []);
      setFormOptions((optionsRes as any)?.data || optionsRes);
    } catch (e) { }
  };

  useEffect(() => {
    fetchAccounts();
    fetchMeta();
  }, []);

  const handleToggleStatus = async (accountId: number) => {
    try {
      await accountApi.toggleAccountStatus(accountId);
      fetchAccounts();
    } catch (err: any) {
      Alert.alert('错误', err.message || '操作失败');
    }
  };

  const handleAddAccount = async () => {
    if (!formData.name.trim()) {
      Alert.alert('提示', '请填写账号名称');
      return;
    }
    setSubmitting(true);
    try {
      await accountApi.createOperatingAccount(formData);
      Alert.alert('成功', '账号创建成功');
      setShowAddModal(false);
      setFormData({ name: '', account_type_id: null, username: '', password: '', platform_name: '' });
      fetchAccounts();
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderAccount = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconBox, { backgroundColor: item.is_active ? Colors.primaryBg : Colors.background }]}>
            <Ionicons
              name="person-circle-outline"
              size={28}
              color={item.is_active ? Colors.primary : Colors.textTertiary}
            />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{item.name || item.username || '未命名'}</Text>
            <Text style={styles.accountType}>
              {item.account_type_name || item.platform_name || '运营账号'}
            </Text>
            {item.username && (
              <Text style={styles.accountMeta}>@{item.username}</Text>
            )}
          </View>
        </View>
        <Switch
          value={item.is_active !== false}
          onValueChange={() => handleToggleStatus(item.id)}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={item.is_active !== false ? Colors.primary : Colors.textTertiary}
        />
      </View>
      {item.platform_name && (
        <View style={styles.cardBottom}>
          <View style={styles.platformBadge}>
            <Text style={styles.platformText}>{item.platform_name}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="账号管理"
        rightAction={{ icon: 'add-circle-outline', onPress: () => setShowAddModal(true) }}
      />

      <FlatList
        data={accounts}
        renderItem={renderAccount}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAccounts(); }} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? <EmptyState icon="key-outline" title="暂无账号" message="点击右上角添加运营账号" /> : null
        }
      />

      {loading && accounts.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* 添加账号弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加运营账号</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>账号名称 *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入账号名称"
                value={formData.name}
                onChangeText={(v) => setFormData({ ...formData, name: v })}
              />

              <Text style={styles.fieldLabel}>账号类型</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {accountTypes.map((type: any) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.chip, formData.account_type_id === type.id && styles.chipActive]}
                    onPress={() => setFormData({ ...formData, account_type_id: type.id })}
                  >
                    <Text style={[styles.chipText, formData.account_type_id === type.id && styles.chipTextActive]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>用户名</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入用户名"
                value={formData.username}
                onChangeText={(v) => setFormData({ ...formData, username: v })}
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>密码</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入密码"
                value={formData.password}
                onChangeText={(v) => setFormData({ ...formData, password: v })}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                onPress={handleAddAccount}
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text },
  accountType: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 2 },
  accountMeta: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  cardBottom: { flexDirection: 'row', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  platformBadge: { backgroundColor: Colors.infoBg, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  platformText: { fontSize: FontSize.xs, color: Colors.info },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, maxHeight: '85%' },
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
  chipRow: { marginBottom: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
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
