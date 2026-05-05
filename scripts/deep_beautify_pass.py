from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        print(f"[skip] {label}")
        return text
    return text.replace(old, new, 1)


def patch_topic_center() -> None:
    path = ROOT / "src/screens/TopicCenter/index.tsx"
    text = path.read_text()
    if "expo-linear-gradient" not in text:
        text = text.replace("import { Ionicons } from '@expo/vector-icons';", "import { Ionicons } from '@expo/vector-icons';\nimport { LinearGradient } from 'expo-linear-gradient';")
    text = text.replace("import { BorderRadius, Colors, FontSize, Shadow, Spacing } from '../../constants/theme';", "import { BorderRadius, Colors, FontSize, Gradients, Shadow, Spacing } from '../../constants/theme';")
    text = replace_once(
        text,
        "      <PageHeader\n        title=\"热点筛选\"\n        hideBack\n      />\n\n      {streamState.isStreaming ? (",
        "      <PageHeader\n        title=\"热点筛选\"\n        subtitle=\"发现值得传播的增长机会\"\n        hideBack\n      />\n\n      <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>\n        <View style={styles.heroGlow} />\n        <Text style={styles.heroEyebrow}>HOTSPOT RADAR</Text>\n        <Text style={styles.heroTitle}>营销热点雷达</Text>\n        <Text style={styles.heroSubtitle}>从全网热点中筛选高转化选题，快速进入 AI 发散与内容生成。</Text>\n        <View style={styles.heroMetrics}>\n          <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{topics.length}</Text><Text style={styles.heroMetricLabel}>当前热点</Text></View>\n          <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{selectedTopics.length}</Text><Text style={styles.heroMetricLabel}>已选题材</Text></View>\n          <View style={styles.heroMetric}><Text style={styles.heroMetricValue}>{currentPlatform === 'all' ? '全域' : SOURCE_LABELS[currentPlatform] || currentPlatform}</Text><Text style={styles.heroMetricLabel}>平台视角</Text></View>\n        </View>\n      </LinearGradient>\n\n      {streamState.isStreaming ? (",
        "TopicCenter hero",
    )
    text = text.replace("contentContainerStyle={{ paddingBottom: ACTION_BAR_HEIGHT + tabBarHeight + Spacing.xxxl, paddingTop: Spacing.xs }}", "contentContainerStyle={{ paddingBottom: ACTION_BAR_HEIGHT + tabBarHeight + Spacing.xxxl, paddingTop: Spacing.md }}")
    style_replacements = {
        "  toolbarShell: {\n    paddingHorizontal: Spacing.lg,\n    paddingTop: Spacing.sm,\n    paddingBottom: Spacing.sm,\n    backgroundColor: Colors.surface,\n    borderBottomWidth: 1,\n    borderBottomColor: Colors.border,\n    ...Shadow.sm,\n  },": "  heroCard: {\n    marginHorizontal: Spacing.lg,\n    marginTop: Spacing.md,\n    marginBottom: Spacing.md,\n    borderRadius: BorderRadius.xxl,\n    padding: Spacing.xxl,\n    overflow: 'hidden',\n    ...Shadow.brand,\n  },\n  heroGlow: {\n    position: 'absolute',\n    right: -36,\n    top: -46,\n    width: 150,\n    height: 150,\n    borderRadius: 75,\n    backgroundColor: 'rgba(255,255,255,0.16)',\n  },\n  heroEyebrow: {\n    color: 'rgba(255,255,255,0.72)',\n    fontSize: FontSize.xs,\n    fontWeight: '900',\n    letterSpacing: 1.2,\n    marginBottom: Spacing.xs,\n  },\n  heroTitle: {\n    color: Colors.textInverse,\n    fontSize: FontSize.xxxl,\n    fontWeight: '900',\n  },\n  heroSubtitle: {\n    color: 'rgba(255,255,255,0.84)',\n    fontSize: FontSize.sm,\n    lineHeight: 20,\n    marginTop: Spacing.sm,\n  },\n  heroMetrics: {\n    flexDirection: 'row',\n    gap: Spacing.sm,\n    marginTop: Spacing.lg,\n  },\n  heroMetric: {\n    flex: 1,\n    borderRadius: BorderRadius.lg,\n    paddingVertical: Spacing.sm,\n    paddingHorizontal: Spacing.sm,\n    backgroundColor: 'rgba(255,255,255,0.14)',\n    borderWidth: 1,\n    borderColor: 'rgba(255,255,255,0.18)',\n  },\n  heroMetricValue: {\n    color: Colors.textInverse,\n    fontSize: FontSize.lg,\n    fontWeight: '900',\n  },\n  heroMetricLabel: {\n    color: 'rgba(255,255,255,0.72)',\n    fontSize: FontSize.xs,\n    marginTop: 2,\n  },\n  toolbarShell: {\n    marginHorizontal: Spacing.lg,\n    marginBottom: Spacing.sm,\n    padding: Spacing.md,\n    backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.xl,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    ...Shadow.md,\n  },",
        "    borderRadius: BorderRadius.md,\n    borderWidth: 1,\n    borderColor: '#bae6fd',\n    backgroundColor: '#e0f2fe',": "    borderRadius: BorderRadius.xl,\n    borderWidth: 1,\n    borderColor: Colors.primarySoft,\n    backgroundColor: Colors.primaryBg,",
        "    borderRadius: BorderRadius.md,\n    borderWidth: 1,\n    borderColor: Colors.border,\n    paddingHorizontal: Spacing.sm,": "    borderRadius: BorderRadius.full,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    paddingHorizontal: Spacing.md,",
        "    paddingHorizontal: Spacing.md,\n    paddingVertical: 6,\n    borderRadius: BorderRadius.full,\n    backgroundColor: Colors.background,\n    borderWidth: 1,\n    borderColor: Colors.border,": "    paddingHorizontal: Spacing.md,\n    paddingVertical: 8,\n    borderRadius: BorderRadius.full,\n    backgroundColor: Colors.surface,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,",
        "    backgroundColor: Colors.primaryBg,\n    borderColor: Colors.primary,": "    backgroundColor: Colors.primary,\n    borderColor: Colors.primary,",
        "    color: Colors.primary,\n    fontWeight: '600',": "    color: Colors.textInverse,\n    fontWeight: '800',",
        "  card: {\n    marginHorizontal: Spacing.lg,\n    marginTop: Spacing.sm,\n    backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.lg,\n    borderWidth: 1,\n    borderColor: Colors.border,\n    padding: Spacing.md,\n    ...Shadow.sm,\n  },": "  card: {\n    marginHorizontal: Spacing.lg,\n    marginTop: Spacing.md,\n    backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.xl,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    padding: Spacing.lg,\n    ...Shadow.md,\n  },",
        "    backgroundColor: Colors.primaryBg,\n    borderColor: Colors.primary,\n  },\n  cardHeader": "    backgroundColor: '#f8fbff',\n    borderColor: Colors.primary,\n    shadowColor: Colors.primary,\n    shadowOpacity: 0.16,\n  },\n  cardHeader",
        "    fontWeight: '700',\n    color: Colors.text,\n    lineHeight: 22,": "    fontWeight: '900',\n    color: Colors.text,\n    lineHeight: 24,",
        "    marginTop: Spacing.xs,\n    color: Colors.textSecondary,\n    lineHeight: 18,": "    marginTop: Spacing.sm,\n    color: Colors.textSecondary,\n    lineHeight: 20,",
    }
    for old, new in style_replacements.items():
        text = text.replace(old, new, 1)
    path.write_text(text)


def patch_historical_list() -> None:
    path = ROOT / "src/screens/HistoricalPlanningList/index.tsx"
    text = path.read_text()
    if "expo-linear-gradient" not in text:
        text = text.replace("} from 'react-native';", "} from 'react-native';\nimport { LinearGradient } from 'expo-linear-gradient';\nimport { Ionicons } from '@expo/vector-icons';", 1)
    text = text.replace("import { BorderRadius, Colors, FontSize, Shadow, Spacing } from '../../constants/theme';", "import { BorderRadius, Colors, FontSize, Gradients, Shadow, Spacing } from '../../constants/theme';")
    text = replace_once(
        text,
        "      <PageHeader title=\"选题库\" hideBack />\n      <View style={styles.filterWrap}>",
        "      <PageHeader title=\"选题库\" subtitle=\"沉淀可复用的增长选题资产\" hideBack />\n      <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.libraryHero}>\n        <View style={styles.libraryGlow} />\n        <Text style={styles.heroEyebrow}>TOPIC ASSETS</Text>\n        <Text style={styles.heroTitle}>历史选题资产库</Text>\n        <Text style={styles.heroDesc}>复盘过往规划批次，快速复用高潜选题与内容方向。</Text>\n        <View style={styles.heroStatsRow}>\n          <View style={styles.heroStat}><Text style={styles.heroStatValue}>{total}</Text><Text style={styles.heroStatLabel}>历史批次</Text></View>\n          <View style={styles.heroStat}><Text style={styles.heroStatValue}>{listData.length}</Text><Text style={styles.heroStatLabel}>当前结果</Text></View>\n        </View>\n      </LinearGradient>\n      <View style={styles.filterWrap}>",
        "Historical hero",
    )
    text = replace_once(text, "        <View style={styles.searchBox}>\n          <TextInput", "        <View style={styles.searchBox}>\n          <Ionicons name=\"search\" size={18} color={Colors.primary} />\n          <TextInput", "Historical search icon")
    replacements = {
        "  filterWrap: {\n    paddingHorizontal: Spacing.lg,\n    paddingTop: Spacing.sm,\n    gap: Spacing.sm,\n  },": "  libraryHero: {\n    marginHorizontal: Spacing.lg,\n    marginTop: Spacing.md,\n    borderRadius: BorderRadius.xxl,\n    padding: Spacing.xxl,\n    overflow: 'hidden',\n    ...Shadow.brand,\n  },\n  libraryGlow: {\n    position: 'absolute',\n    right: -44,\n    top: -54,\n    width: 160,\n    height: 160,\n    borderRadius: 80,\n    backgroundColor: 'rgba(255,255,255,0.14)',\n  },\n  heroEyebrow: {\n    color: 'rgba(255,255,255,0.72)',\n    fontSize: FontSize.xs,\n    fontWeight: '900',\n    letterSpacing: 1.2,\n  },\n  heroTitle: {\n    marginTop: Spacing.xs,\n    color: Colors.textInverse,\n    fontSize: FontSize.xxxl,\n    fontWeight: '900',\n  },\n  heroDesc: {\n    marginTop: Spacing.sm,\n    color: 'rgba(255,255,255,0.84)',\n    fontSize: FontSize.sm,\n    lineHeight: 20,\n  },\n  heroStatsRow: {\n    flexDirection: 'row',\n    gap: Spacing.sm,\n    marginTop: Spacing.lg,\n  },\n  heroStat: {\n    flex: 1,\n    borderRadius: BorderRadius.lg,\n    backgroundColor: 'rgba(255,255,255,0.14)',\n    borderWidth: 1,\n    borderColor: 'rgba(255,255,255,0.18)',\n    padding: Spacing.sm,\n  },\n  heroStatValue: {\n    color: Colors.textInverse,\n    fontSize: FontSize.xl,\n    fontWeight: '900',\n  },\n  heroStatLabel: {\n    color: 'rgba(255,255,255,0.72)',\n    fontSize: FontSize.xs,\n    marginTop: 2,\n  },\n  filterWrap: {\n    marginHorizontal: Spacing.lg,\n    marginTop: Spacing.md,\n    padding: Spacing.md,\n    gap: Spacing.sm,\n    borderRadius: BorderRadius.xl,\n    backgroundColor: Colors.surface,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    ...Shadow.md,\n  },",
        "    backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.md,\n    borderWidth: 1,\n    borderColor: Colors.border,\n    paddingHorizontal: Spacing.sm,": "    backgroundColor: Colors.background,\n    borderRadius: BorderRadius.full,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    paddingHorizontal: Spacing.md,",
        "    backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.lg,\n    borderWidth: 1,\n    borderColor: Colors.border,\n    padding: Spacing.md,\n    ...Shadow.sm,": "    backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.xl,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    padding: Spacing.lg,\n    ...Shadow.md,",
        "    fontWeight: '700',\n    lineHeight: 22,": "    fontWeight: '900',\n    lineHeight: 24,",
        "    borderRadius: BorderRadius.sm,\n    backgroundColor: Colors.primaryBg,": "    borderRadius: BorderRadius.full,\n    backgroundColor: Colors.primaryBg,",
    }
    for old, new in replacements.items():
        text = text.replace(old, new, 1)
    path.write_text(text)


def patch_thread_list() -> None:
    path = ROOT / "src/components/ThreadList.tsx"
    text = path.read_text()
    text = text.replace("import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';", "import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../constants/theme';")
    replacements = {
        "  header: {\n    paddingHorizontal: Spacing.lg,\n    paddingVertical: Spacing.md,\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n  },": "  header: {\n    marginHorizontal: Spacing.lg,\n    marginTop: Spacing.md,\n    marginBottom: Spacing.md,\n    padding: Spacing.lg,\n    flexDirection: 'row',\n    justifyContent: 'space-between',\n    alignItems: 'center',\n    backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.xl,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    ...Shadow.md,\n  },",
        "  headerTitle: {\n    fontSize: FontSize.xl,\n    fontWeight: '700',\n    color: Colors.text,\n  },": "  headerTitle: {\n    fontSize: FontSize.xl,\n    fontWeight: '900',\n    color: Colors.text,\n  },",
        "  headerCount: {\n    color: Colors.textSecondary,\n    fontSize: FontSize.sm,\n  },": "  headerCount: {\n    color: Colors.primaryDark,\n    fontSize: FontSize.sm,\n    fontWeight: '800',\n    backgroundColor: Colors.primaryBg,\n    paddingHorizontal: Spacing.md,\n    paddingVertical: 6,\n    borderRadius: BorderRadius.full,\n  },",
        "  listContent: {\n    padding: Spacing.lg,\n    paddingTop: 0,\n    paddingBottom: 100,\n  },": "  listContent: {\n    paddingHorizontal: Spacing.lg,\n    paddingTop: 0,\n    paddingBottom: 110,\n  },",
        "  card: {\n    backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.lg,\n    padding: Spacing.lg,\n    marginBottom: Spacing.md,\n    borderWidth: 1,\n    borderColor: Colors.border,\n    ...Shadow.sm,\n  },": "  card: {\n    backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.xl,\n    padding: Spacing.lg,\n    marginBottom: Spacing.md,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    ...Shadow.md,\n  },",
        "  statusBadge: {\n    paddingHorizontal: Spacing.sm,\n    paddingVertical: 2,\n    borderRadius: BorderRadius.sm,\n  },": "  statusBadge: {\n    paddingHorizontal: Spacing.md,\n    paddingVertical: 5,\n    borderRadius: BorderRadius.full,\n  },",
        "  statusText: {\n    fontSize: FontSize.xs,\n    fontWeight: '600',\n  },": "  statusText: {\n    fontSize: FontSize.xs,\n    fontWeight: '900',\n  },",
        "  cardTitle: {\n    fontSize: FontSize.lg,\n    fontWeight: '600',": "  cardTitle: {\n    fontSize: FontSize.lg,\n    fontWeight: '900',",
        "  tag: {\n    backgroundColor: Colors.primaryBg,\n    borderRadius: BorderRadius.sm,\n    paddingHorizontal: Spacing.sm,\n    paddingVertical: 2,\n  },": "  tag: {\n    backgroundColor: Colors.primaryBg,\n    borderRadius: BorderRadius.full,\n    paddingHorizontal: Spacing.sm,\n    paddingVertical: 4,\n    borderWidth: 1,\n    borderColor: Colors.primarySoft,\n  },",
        "    paddingVertical: Spacing.xs,\n    borderRadius: BorderRadius.md,": "    paddingVertical: 8,\n    borderRadius: BorderRadius.full,",
    }
    for old, new in replacements.items():
        text = text.replace(old, new, 1)
    path.write_text(text)


def main() -> None:
    patch_topic_center()
    patch_historical_list()
    patch_thread_list()
    print("Deep beautify pass applied")


if __name__ == "__main__":
    main()
