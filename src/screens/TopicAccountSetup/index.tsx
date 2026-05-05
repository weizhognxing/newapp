import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import PageHeader from '../../components/PageHeader';
import BottomActionBar from '../../components/BottomActionBar';
import { accountApi } from '../../api/account';
import { authStore } from '../../store/auth';
import { BorderRadius, Colors, FontSize, Shadow, Spacing } from '../../constants/theme';

type SelectorOption = {
  id: number | string;
  label: string;
  value?: string | number;
  raw?: any;
};

const ACTION_BAR_HEIGHT = 104;

const normalizeArray = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const toOption = (item: any, fallback = '未命名') => ({
  id: item?.id ?? item?.article_type ?? item?.type_name ?? fallback,
  label: item?.name || item?.type_name || item?.username || item?.account_name || fallback,
  value: item?.article_type ?? item?.value ?? item?.id,
  raw: item,
});

export default function TopicAccountSetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const selectedTopics = route.params?.selectedTopics || [];
  const userRequirement = route.params?.userRequirement || '';

  const [accountTypes, setAccountTypes] = useState<SelectorOption[]>([]);
  const [accounts, setAccounts] = useState<SelectorOption[]>([]);
  const [articleTypes, setArticleTypes] = useState<SelectorOption[]>([]);
  const [selectedAccountType, setSelectedAccountType] = useState<number | string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedArticleType, setSelectedArticleType] = useState<string | number | null>(null);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [typeRes, articleRes] = await Promise.all([
          accountApi.getAccountTypes(),
          accountApi.getArticleTypes(),
        ]);
        setAccountTypes(normalizeArray(typeRes).map((item) => toOption(item)));
        setArticleTypes(normalizeArray(articleRes).map((item) => toOption(item)));
      } catch (error) {
        Alert.alert('加载失败', '账号元数据加载失败');
      }
    };

    loadMeta();
  }, []);

  const loadAccounts = async (accountTypeId: number | string) => {
    try {
      const response = await accountApi.getAccountsByType(Number(accountTypeId));
      setAccounts(normalizeArray(response).map((item) => toOption(item, '未命名账号')));
    } catch (error) {
      setAccounts([]);
      Alert.alert('加载失败', '账号列表加载失败');
    }
  };

  const selectedAccountProfile = useMemo(
    () => ({
      account_id: selectedAccount?.id ?? null,
      account_name: selectedAccount?.username || selectedAccount?.name || '',
      position: selectedAccount?.position || null,
      topic_divergence_prompt: selectedAccount?.topic_divergence_prompt || null,
      fact_packages: selectedAccount?.fact_packages || [],
    }),
    [selectedAccount]
  );

  const factSummary = useMemo(() => {
    const factPackages = selectedAccountProfile.fact_packages || [];
    return factPackages
      .map((item: any) => {
        const parts: string[] = [];
        if (item?.summary) parts.push(`【摘要】${item.summary}`);
        if (item?.content) parts.push(`【详细内容】${item.content}`);
        return parts.join('\n');
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
  }, [selectedAccountProfile.fact_packages]);

  const validationMessage = useMemo(() => {
    if (!selectedAccountType || !selectedAccountProfile.account_id || !selectedArticleType) {
      return '请先完成账号和文章类型选择';
    }
    return '';
  }, [selectedAccountProfile.account_id, selectedAccountType, selectedArticleType]);

  const canSubmit = !validationMessage && selectedTopics.length > 0;

  const formatTopicForDify = (topic: any) => {
    if (typeof topic === 'string') return topic;

    const title = topic?.title?.trim?.() || '';
    const content = topic?.content?.trim?.() || '';

    if (!title) return content;
    if (!content) return title;

    return `标题：${title}\n内容：${content}`;
  };

  const handleGenerateTopics = async () => {
    if (!canSubmit) {
      Alert.alert('提示', validationMessage || '请先选择热点');
      return;
    }

    const query = userRequirement.trim() || '请根据这些热点生成适合该账号的选题';
    const topics = selectedTopics.map(formatTopicForDify).filter(Boolean);

    navigation.navigate('DivergenceResult', {
      query,
      articleType: selectedArticleType,
      accountName: selectedAccountProfile.account_name,
      accountId: selectedAccountProfile.account_id,
      accountTypeId: selectedAccountType,
      sourceTopics: selectedTopics,
      streamRequest: {
        query,
        topics,
        summary: factSummary || null,
        position: selectedAccountProfile.position,
        userId: authStore.getUser()?.id,
        topicPrompt: selectedAccountProfile.topic_divergence_prompt || null,
      },
    });
  };

  return (
    <View style={styles.container}>
      <PageHeader title="选择发布账号" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: ACTION_BAR_HEIGHT + tabBarHeight + Spacing.xxxl }}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>账号类型</Text>
          <View style={styles.chipWrap}>
            {accountTypes.map((option) => (
              <SelectorChip
                key={String(option.id)}
                label={option.label}
                active={selectedAccountType === option.id}
                onPress={async () => {
                  setSelectedAccountType(option.id);
                  setSelectedAccount(null);
                  setAccounts([]);
                  await loadAccounts(option.id);
                }}
              />
            ))}
          </View>

          <Text style={styles.cardTitle}>账号名称</Text>
          <View style={styles.chipWrap}>
            {accounts.length ? accounts.map((option) => (
              <SelectorChip
                key={String(option.id)}
                label={option.label}
                active={selectedAccountProfile.account_id === option.raw?.id}
                onPress={() => setSelectedAccount(option.raw)}
              />
            )) : <Text style={styles.helper}>请选择具体发布账号。</Text>}
          </View>

          <Text style={styles.cardTitle}>文章类型</Text>
          <View style={styles.chipWrap}>
            {articleTypes.map((option) => (
              <SelectorChip
                key={String(option.id)}
                label={option.label}
                active={selectedArticleType === (option.value ?? option.id)}
                onPress={() => setSelectedArticleType(option.value ?? option.id)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomActionBar
        summary={`热点 ${selectedTopics.length} 个，发布账号 ${selectedAccountProfile.account_name || '未选择'}`}
        primaryLabel="提交并生成选题"
        onPrimaryPress={handleGenerateTopics}
        disabled={!canSubmit}
        secondaryLabel="上一步"
        onSecondaryPress={() => navigation.goBack()}
        bottomOffset={tabBarHeight}
      />
    </View>
  );
}

function SelectorChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  helper: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  validation: {
    marginTop: Spacing.md,
    color: Colors.warning,
    fontSize: FontSize.sm,
  },
});
