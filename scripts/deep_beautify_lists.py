from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def patch_generation() -> None:
    p = ROOT / 'src/screens/GenerationList/index.tsx'
    t = p.read_text()
    t = t.replace("import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';", "import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';")
    reps = {
        "      <PageHeader title=\"生成列表\" hideBack />": "      <PageHeader title=\"生成列表\" subtitle=\"追踪 AI 内容生产全流程\" hideBack />",
        "  tabBar: {\n    flexDirection: 'row',\n    backgroundColor: Colors.surface,\n    paddingHorizontal: Spacing.lg,\n    borderBottomWidth: 1,\n    borderBottomColor: Colors.border,\n  },": "  tabBar: {\n    flexDirection: 'row',\n    backgroundColor: Colors.surface,\n    marginHorizontal: Spacing.lg,\n    marginTop: Spacing.md,\n    marginBottom: Spacing.sm,\n    padding: 4,\n    borderRadius: BorderRadius.full,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    ...Shadow.md,\n  },",
        "    paddingVertical: Spacing.md,\n    alignItems: 'center',\n    borderBottomWidth: 2,\n    borderBottomColor: 'transparent',": "    paddingVertical: 9,\n    alignItems: 'center',\n    borderRadius: BorderRadius.full,",
        "  tabActive: {\n    borderBottomColor: Colors.primary,\n  },": "  tabActive: {\n    backgroundColor: Colors.primary,\n    ...Shadow.brand,\n  },",
        "  tabTextActive: {\n    color: Colors.primary,\n    fontWeight: '600',\n  },": "  tabTextActive: {\n    color: Colors.textInverse,\n    fontWeight: '900',\n  },",
    }
    for old, new in reps.items():
        t = t.replace(old, new, 1)
    p.write_text(t)


def patch_publish() -> None:
    p = ROOT / 'src/screens/PublishList/index.tsx'
    t = p.read_text()
    t = t.replace("      <PageHeader title=\"发布列表\" hideBack />", "      <PageHeader title=\"发布列表\" subtitle=\"监控多平台分发效果\" hideBack />")
    reps = {
        "  tabBar: {\n    flexDirection: 'row',\n    backgroundColor: Colors.surface,\n    paddingHorizontal: Spacing.lg,\n    borderBottomWidth: 1,\n    borderBottomColor: Colors.border,\n  },": "  tabBar: {\n    flexDirection: 'row',\n    backgroundColor: Colors.surface,\n    marginHorizontal: Spacing.lg,\n    marginTop: Spacing.md,\n    marginBottom: Spacing.sm,\n    padding: 4,\n    borderRadius: BorderRadius.full,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    ...Shadow.md,\n  },",
        "    paddingVertical: Spacing.md,\n    alignItems: 'center',\n    borderBottomWidth: 2,\n    borderBottomColor: 'transparent',": "    paddingVertical: 9,\n    alignItems: 'center',\n    borderRadius: BorderRadius.full,",
        "  tabActive: {\n    borderBottomColor: Colors.primary,\n  },": "  tabActive: {\n    backgroundColor: Colors.primary,\n    ...Shadow.brand,\n  },",
        "  tabTextActive: {\n    color: Colors.primary,\n    fontWeight: '600',\n  },": "  tabTextActive: {\n    color: Colors.textInverse,\n    fontWeight: '900',\n  },",
        "  totalRow: {\n    paddingHorizontal: Spacing.lg,\n    paddingTop: Spacing.sm,\n  },": "  totalRow: {\n    paddingHorizontal: Spacing.lg,\n    paddingTop: Spacing.xs,\n    alignItems: 'flex-end',\n  },",
        "    backgroundColor: Colors.surface,\n    borderWidth: 1,\n    borderColor: Colors.border,\n    borderRadius: BorderRadius.lg,\n    padding: Spacing.md,\n    ...Shadow.sm,": "    backgroundColor: Colors.surface,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    borderRadius: BorderRadius.xl,\n    padding: Spacing.lg,\n    ...Shadow.md,",
        "    fontWeight: '700',\n  },\n  statusBadge": "    fontWeight: '900',\n  },\n  statusBadge",
        "    borderRadius: BorderRadius.sm,\n    paddingHorizontal: Spacing.sm,\n    paddingVertical: 3,": "    borderRadius: BorderRadius.full,\n    paddingHorizontal: Spacing.md,\n    paddingVertical: 5,",
        "    borderRadius: BorderRadius.md,\n    paddingHorizontal: Spacing.md,\n    paddingVertical: 6,": "    borderRadius: BorderRadius.full,\n    paddingHorizontal: Spacing.md,\n    paddingVertical: 8,",
    }
    for old, new in reps.items():
        t = t.replace(old, new, 1)
    p.write_text(t)


def main() -> None:
    patch_generation()
    patch_publish()
    print('Generation and publish list visuals upgraded')

if __name__ == '__main__':
    main()
