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
import { staffApi } from '../../api/tenants';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';

export default function StaffManageScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', nickname: '', role: 'user' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res: any = await staffApi.getUsers();
      setUsers(res?.data || res || []);
    } catch (err: any) {
      console.error('获取用户列表失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!formData.username.trim() || !formData.password.trim()) {
      Alert.alert('提示', '请填写用户名和密码');
      return;
    }
    setSubmitting(true);
    try {
      await staffApi.createUser(formData);
      Alert.alert('成功', '用户创建成功');
      setShowAddModal(false);
      setFormData({ username: '', password: '', nickname: '', role: 'user' });
      fetchUsers();
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = (userId: number, username: string) => {
    Alert.alert('确认删除', `确定要删除用户 "${username}" 吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await staffApi.deleteUser(userId);
            Alert.alert('成功', '已删除');
            fetchUsers();
          } catch (err: any) {
            Alert.alert('错误', err.message || '删除失败');
          }
        },
      },
    ]);
  };

  const renderUser = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.nickname || item.username || '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nickname || item.username}</Text>
          <Text style={styles.userRole}>{item.role === 'admin' ? '管理员' : '普通用户'}</Text>
          <Text style={styles.userMeta}>@{item.username}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteUser(item.id, item.username)}
      >
        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="人员管理"
        subtitle="配置团队成员与协作权限"
        rightAction={{ icon: 'add-circle-outline', onPress: () => setShowAddModal(true) }}
      />

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? <EmptyState icon="people-outline" title="暂无人员" message="点击右上角添加人员" /> : null
        }
      />

      {loading && users.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* 添加用户弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加人员</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>用户名 *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入用户名"
                value={formData.username}
                onChangeText={(v) => setFormData({ ...formData, username: v })}
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>密码 *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入密码"
                value={formData.password}
                onChangeText={(v) => setFormData({ ...formData, password: v })}
                secureTextEntry
              />
              <Text style={styles.fieldLabel}>昵称</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入昵称"
                value={formData.nickname}
                onChangeText={(v) => setFormData({ ...formData, nickname: v })}
              />
              <Text style={styles.fieldLabel}>角色</Text>
              <View style={styles.roleRow}>
                {['user', 'admin'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleChip, formData.role === role && styles.roleChipActive]}
                    onPress={() => setFormData({ ...formData, role })}
                  >
                    <Text style={[styles.roleChipText, formData.role === role && styles.roleChipTextActive]}>
                      {role === 'admin' ? '管理员' : '普通用户'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.6 }]}
                onPress={handleAddUser}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.md,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text },
  userRole: { fontSize: FontSize.sm, color: Colors.primary, marginTop: 2 },
  userMeta: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  deleteBtn: { padding: Spacing.sm },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.8)' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text },
  modalBody: { padding: Spacing.lg },
  fieldLabel: { fontSize: FontSize.md, fontWeight: '500', color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.md },
  fieldInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  roleRow: { flexDirection: 'row', gap: Spacing.md },
  roleChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  roleChipText: { fontSize: FontSize.md, color: Colors.textSecondary },
  roleChipTextActive: { color: Colors.primary, fontWeight: '800' },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
  submitButtonText: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff' },
});
