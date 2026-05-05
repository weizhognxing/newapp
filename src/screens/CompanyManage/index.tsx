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
import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';

export default function CompanyManageScreen() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    name: '',
    fullname: '',
    industry: '',
    contact_name: '',
    contact_phone: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res: any = await companyApi.getDirectory();
      setCompanies(res?.data || res || []);
    } catch (err: any) {
      console.error('获取公司列表失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res: any = await companyApi.getIndustryCategories();
      setCategories(res?.data || res || []);
    } catch (e) { }
  };

  useEffect(() => {
    fetchCompanies();
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!formData.name.trim()) {
      Alert.alert('提示', '请填写公司名称');
      return;
    }
    setSubmitting(true);
    try {
      await companyApi.createTenant(formData);
      Alert.alert('成功', '公司创建成功');
      setShowAddModal(false);
      setFormData({ name: '', fullname: '', industry: '', contact_name: '', contact_phone: '', address: '' });
      fetchCompanies();
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.detail || err.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const renderCompany = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || '?')[0]}</Text>
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{item.fullname || item.name || '未命名'}</Text>
          <Text style={styles.companyShort}>{item.name || '-'}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        {item.industry && (
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.infoText}>{item.industry}</Text>
          </View>
        )}
        {item.contact_name && (
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.infoText}>{item.contact_name}</Text>
          </View>
        )}
        {item.contact_phone && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={Colors.textTertiary} />
            <Text style={styles.infoText}>{item.contact_phone}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>
          ID: {item.id} | 创建: {item.created_at ? new Date(item.created_at).toLocaleDateString('zh-CN') : '-'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="公司管理"
        subtitle="管理平台租户与企业资料"
        rightAction={{ icon: 'add-circle-outline', onPress: () => setShowAddModal(true) }}
      />

      <FlatList
        data={companies}
        renderItem={renderCompany}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCompanies(); }} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? <EmptyState icon="business-outline" title="暂无公司" /> : null
        }
      />

      {/* 添加公司弹窗 */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>添加公司</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>公司简称 *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入公司简称"
                value={formData.name}
                onChangeText={(v) => setFormData({ ...formData, name: v })}
              />
              <Text style={styles.fieldLabel}>公司全称</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入公司全称"
                value={formData.fullname}
                onChangeText={(v) => setFormData({ ...formData, fullname: v })}
              />
              <Text style={styles.fieldLabel}>行业</Text>
              {categories.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {categories.map((cat: any, i: number) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.chip, formData.industry === (cat.name || cat) && styles.chipActive]}
                      onPress={() => setFormData({ ...formData, industry: cat.name || cat })}
                    >
                      <Text style={[styles.chipText, formData.industry === (cat.name || cat) && styles.chipTextActive]}>
                        {cat.name || cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <TextInput
                  style={styles.fieldInput}
                  placeholder="请输入行业"
                  value={formData.industry}
                  onChangeText={(v) => setFormData({ ...formData, industry: v })}
                />
              )}
              <Text style={styles.fieldLabel}>联系人</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入联系人"
                value={formData.contact_name}
                onChangeText={(v) => setFormData({ ...formData, contact_name: v })}
              />
              <Text style={styles.fieldLabel}>联系电话</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入联系电话"
                value={formData.contact_phone}
                onChangeText={(v) => setFormData({ ...formData, contact_phone: v })}
                keyboardType="phone-pad"
              />
              <Text style={styles.fieldLabel}>地址</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="请输入地址"
                value={formData.address}
                onChangeText={(v) => setFormData({ ...formData, address: v })}
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
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.primary },
  companyInfo: { flex: 1 },
  companyName: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text },
  companyShort: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  cardBody: { gap: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  infoText: { fontSize: FontSize.md, color: Colors.textSecondary },
  cardFooter: { marginTop: Spacing.md, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderLight },
  footerText: { fontSize: FontSize.xs, color: Colors.textTertiary },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl, maxHeight: '90%' },
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
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  chipTextActive: { color: Colors.textInverse, fontWeight: '900' },
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
