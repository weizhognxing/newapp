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
import { companyApi } from '../../api/company';
import { authStore } from '../../store/auth';
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';

export default function MaterialManageScreen() {
  const [factPackages, setFactPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const fetchFactPackages = async () => {
    setLoading(true);
    try {
      const tenantId = authStore.getEffectiveTenantId();
      const res: any = await companyApi.getFactPackages({ tenant_id: tenantId });
      setFactPackages(res?.data || res || []);
    } catch (err: any) {
      console.error('获取事实包失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFactPackages();
  }, []);

  const handleAdd = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      Alert.alert('提示', '请填写标题和内容');
      return;
    }
    setSubmitting(true);
    try {
      await companyApi.createFactPackage({
        ...formData,
        tenant_id: authStore.getEffectiveTenantId(),
      });
      Alert.alert('成功', '素材添加成功');
      setShowAddModal(false);
      setFormData({ title: '', content: '', category: '' });
      fetchFactPackages();
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || err.message || '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (factId: number) => {
    Alert.alert('确认删除', '删除后不可恢复', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await companyApi.deleteFactPackage(factId);
            fetchFactPackages();
          } catch (err: any) {
            Alert.alert('错误', err.message || '删除失败');
          }
        },
      },
    ]);
  };

  const handleBatchDelete = () => {
    if (selectedItems.size === 0) {
      Alert.alert('提示', '请先选择要删除的素材');
      return;
    }
    Alert.alert('确认批量删除', `确定要删除选中的 ${selectedItems.size} 条素材吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await companyApi.batchDeleteFactPackages(Array.from(selectedItems));
            setSelectedItems(new Set());
            fetchFactPackages();
          } catch (err: any) {
            Alert.alert('错误', err.message || '批量删除失败');
          }
        },
      },
    ]);
  };

  const toggleSelect = (id: number) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const selected = selectedItems.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        onPress={() => toggleSelect(item.id)}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Ionicons
              name={selected ? 'checkbox' : 'square-outline'}
              size={20}
              color={selected ? Colors.primary : Colors.textTertiary}
            />
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title || '未命名'}</Text>
          </View>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardContent} numberOfLines={3}>{item.content || '-'}</Text>
        <Text style={styles.cardDate}>
          {item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="素材管理"
        subtitle="沉淀品牌素材与事实知识"
        rightAction={{ icon: 'add-circle-outline', onPress: () => setShowAddModal(true) }}
      />

      {selectedItems.size > 0 && (
        <View style={styles.batchBar}>
          <Text style={styles.batchText}>已选 {selectedItems.size} 项</Text>
          <TouchableOpacity style={styles.batchDeleteBtn} onPress={handleBatchDelete}>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            <Text style={styles.batchDeleteText}>批量删除</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={factPackages}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFactPackages(); }} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? <EmptyState icon="folder-open-outline" title="暂无素材" message="点击右上角添加事实包素材" /> : null
        }
      />

      {/* 添加弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加素材</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>标题 *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入标题"
                value={formData.title}
                onChangeText={(v) => setFormData({ ...formData, title: v })}
              />
              <Text style={styles.fieldLabel}>分类</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入分类"
                value={formData.category}
                onChangeText={(v) => setFormData({ ...formData, category: v })}
              />
              <Text style={styles.fieldLabel}>内容 *</Text>
              <TextInput
                style={[styles.fieldInput, styles.textArea]}
                placeholder="请输入素材内容"
                value={formData.content}
                onChangeText={(v) => setFormData({ ...formData, content: v })}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
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
  batchBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  batchText: { fontSize: FontSize.md, color: Colors.warning, fontWeight: '500' },
  batchDeleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  batchDeleteText: { fontSize: FontSize.md, color: Colors.danger, fontWeight: '500' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  cardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryBg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.sm },
  cardTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text, flex: 1 },
  categoryBadge: { backgroundColor: Colors.infoBg, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  categoryText: { fontSize: FontSize.xs, color: Colors.info },
  cardContent: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  cardDate: { fontSize: FontSize.xs, color: Colors.textTertiary },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, maxHeight: '85%' },
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
  textArea: { height: 120, paddingTop: Spacing.md },
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
