import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import PageHeader from '../../components/PageHeader';
import ThreadList from '../../components/ThreadList';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';

const TABS = [
  { key: 'all', label: '全部', statuses: [], dataSource: 'mixed' as const },
  { key: 'pending_generate', label: '待生成', statuses: [0], dataSource: 'divergence' as const },
  { key: 'generating', label: '生成中', statuses: [1], dataSource: 'divergence' as const },
  { key: 'pending_review', label: '待审核', statuses: [0], dataSource: 'threads' as const },
];

const GENERATION_STATUS_LABELS: Record<number, string> = {
  0: '待生成',
  1: '生成中',
};

const REVIEW_STATUS_LABELS: Record<number, string> = {
  0: '待审核',
};

export default function GenerationListScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const currentTab = TABS.find((t) => t.key === activeTab) || TABS[0];
  const reviewMode = currentTab.dataSource === 'threads';

  return (
    <View style={styles.container}>
      <PageHeader title="生成列表" hideBack />

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ThreadList
        key={activeTab}
        statuses={currentTab.statuses}
        title=""
        showDelete
        showApprove={reviewMode}
        showArticlePreview={reviewMode}
        statusTextMap={reviewMode ? REVIEW_STATUS_LABELS : GENERATION_STATUS_LABELS}
        dataSource={currentTab.dataSource}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
