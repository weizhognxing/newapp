from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ROOT / 'src/screens/AccountManage/index.tsx',
    ROOT / 'src/screens/StaffManage/index.tsx',
    ROOT / 'src/screens/DeviceManage/index.tsx',
    ROOT / 'src/screens/MaterialManage/index.tsx',
    ROOT / 'src/screens/CompanyManage/index.tsx',
]
SUBTITLES = {
    '账号管理': '统一维护多平台发布账号',
    '人员管理': '配置团队成员与协作权限',
    '设备管理': '掌握发布终端与设备状态',
    '素材管理': '沉淀品牌素材与事实知识',
    '公司管理': '管理平台租户与企业资料',
}

COMMON_REPLACEMENTS = [
    ("backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.lg,\n    padding: Spacing.lg,\n    marginBottom: Spacing.md,\n    ...Shadow.sm,", "backgroundColor: Colors.surface,\n    borderRadius: BorderRadius.xl,\n    padding: Spacing.lg,\n    marginBottom: Spacing.md,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    ...Shadow.md,"),
    ("borderRadius: BorderRadius.md,\n    justifyContent: 'center',\n    alignItems: 'center',", "borderRadius: BorderRadius.lg,\n    justifyContent: 'center',\n    alignItems: 'center',\n    borderWidth: 1,\n    borderColor: Colors.primarySoft,"),
    ("fontWeight: '600', color: Colors.text", "fontWeight: '900', color: Colors.text"),
    ("fontWeight: '600', color: Colors.primary", "fontWeight: '900', color: Colors.primary"),
    ("borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2", "borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4"),
    ("borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl", "borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl"),
    ("borderColor: Colors.border,\n    paddingHorizontal: Spacing.md,\n    height: 44,", "borderColor: Colors.borderLight,\n    paddingHorizontal: Spacing.md,\n    height: 48,"),
    ("borderRadius: BorderRadius.md,\n    paddingVertical: Spacing.md,", "borderRadius: BorderRadius.full,\n    paddingVertical: Spacing.md,"),
    ("chipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },", "chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },"),
    ("chipTextActive: { color: Colors.primary, fontWeight: '600' },", "chipTextActive: { color: Colors.textInverse, fontWeight: '900' },"),
]

def add_subtitle(text: str) -> str:
    for title, subtitle in SUBTITLES.items():
        old = f"title=\"{title}\""
        if old in text and f"subtitle=\"{subtitle}\"" not in text:
            return text.replace(old, f"title=\"{title}\"\n        subtitle=\"{subtitle}\"", 1)
    return text


def patch_file(path: Path) -> None:
    text = path.read_text()
    text = add_subtitle(text)
    for old, new in COMMON_REPLACEMENTS:
        text = text.replace(old, new)
    # More aggressive but safe one-line style upgrades used by several admin pages.
    text = text.replace("...Shadow.sm,", "...Shadow.md,")
    text = text.replace("borderRadius: BorderRadius.lg,", "borderRadius: BorderRadius.xl,")
    text = text.replace("borderRadius: BorderRadius.md,", "borderRadius: BorderRadius.lg,")
    text = text.replace("fontWeight: '600'", "fontWeight: '800'")
    text = text.replace("fontWeight: '700'", "fontWeight: '900'")
    path.write_text(text)


def main() -> None:
    for file in FILES:
        if file.exists():
            patch_file(file)
            print('patched', file.relative_to(ROOT))

if __name__ == '__main__':
    main()
