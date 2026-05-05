from __future__ import annotations

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def patch_console() -> None:
    path = ROOT / "src/screens/ConsoleDashboard/index.tsx"
    text = path.read_text()
    if "expo-linear-gradient" not in text:
        text = text.replace("import { Ionicons } from '@expo/vector-icons';", "import { Ionicons } from '@expo/vector-icons';\nimport { LinearGradient } from 'expo-linear-gradient';")
    text = text.replace("import { Colors, Spacing, FontSize, BorderRadius, Shadow } from '../../constants/theme';", "import { Colors, Spacing, FontSize, BorderRadius, Gradients, Shadow } from '../../constants/theme';")
    text = text.replace(
        "        {/* 统计卡片 */}\n        <View style={styles.statsGrid}>",
        "        <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dashboardHero}>\n          <View style={styles.dashboardGlow} />\n          <Text style={styles.heroEyebrow}>PLATFORM INSIGHT</Text>\n          <Text style={styles.heroTitle}>增长数据驾驶舱</Text>\n          <Text style={styles.heroDesc}>实时掌握公司、用户、设备与内容资产的运营状态。</Text>\n        </LinearGradient>\n\n        {/* 统计卡片 */}\n        <View style={styles.statsGrid}>",
        1,
    )
    replacements = {
        "  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },": "  scrollContent: { padding: Spacing.lg, paddingBottom: 110 },\n  dashboardHero: {\n    borderRadius: BorderRadius.xxl,\n    padding: Spacing.xxl,\n    marginBottom: Spacing.lg,\n    overflow: 'hidden',\n    ...Shadow.brand,\n  },\n  dashboardGlow: {\n    position: 'absolute',\n    width: 180,\n    height: 180,\n    borderRadius: 90,\n    right: -48,\n    top: -64,\n    backgroundColor: 'rgba(255,255,255,0.16)',\n  },\n  heroEyebrow: {\n    color: 'rgba(255,255,255,0.72)',\n    fontSize: FontSize.xs,\n    fontWeight: '900',\n    letterSpacing: 1.2,\n  },\n  heroTitle: {\n    color: Colors.textInverse,\n    fontSize: FontSize.xxxl,\n    fontWeight: '900',\n    marginTop: Spacing.xs,\n  },\n  heroDesc: {\n    color: 'rgba(255,255,255,0.84)',\n    fontSize: FontSize.sm,\n    lineHeight: 20,\n    marginTop: Spacing.sm,\n  },",
        "  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },": "  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },",
        "    borderRadius: BorderRadius.lg,\n    padding: Spacing.lg,\n    alignItems: 'center',\n  },": "    borderRadius: BorderRadius.xl,\n    padding: Spacing.lg,\n    alignItems: 'center',\n    borderWidth: 1,\n    borderColor: 'rgba(255,255,255,0.72)',\n    ...Shadow.md,\n  },",
        "  statValue: { fontSize: FontSize.xxxl, fontWeight: '700', marginTop: Spacing.sm },": "  statValue: { fontSize: FontSize.xxxl, fontWeight: '900', marginTop: Spacing.sm },",
        "    borderRadius: BorderRadius.lg,\n    padding: Spacing.lg,\n    marginBottom: Spacing.lg,\n    ...Shadow.sm,": "    borderRadius: BorderRadius.xl,\n    padding: Spacing.lg,\n    marginBottom: Spacing.lg,\n    borderWidth: 1,\n    borderColor: Colors.borderLight,\n    ...Shadow.md,",
        "  sectionTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.text, marginBottom: Spacing.lg },": "  sectionTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text, marginBottom: Spacing.lg },",
        "  quickAction: { alignItems: 'center' },": "  quickAction: { alignItems: 'center', flex: 1 },",
        "    backgroundColor: Colors.primaryBg,\n    justifyContent: 'center',": "    backgroundColor: Colors.primaryBg,\n    borderWidth: 1,\n    borderColor: Colors.primarySoft,\n    justifyContent: 'center',",
        "  quickActionLabel: { fontSize: FontSize.sm, color: Colors.text },": "  quickActionLabel: { fontSize: FontSize.sm, color: Colors.text, fontWeight: '700' },",
        "    paddingVertical: Spacing.md,\n    borderBottomWidth: 1,": "    padding: Spacing.md,\n    marginBottom: Spacing.sm,\n    borderRadius: BorderRadius.lg,\n    backgroundColor: Colors.background,\n    borderWidth: 1,",
        "    borderBottomColor: Colors.borderLight,": "    borderColor: Colors.borderLight,",
        "    borderRadius: 20,\n    backgroundColor: Colors.primaryBg,": "    borderRadius: 20,\n    backgroundColor: Colors.primaryBg,\n    borderWidth: 1,\n    borderColor: Colors.primarySoft,",
        "  companyAvatarText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },": "  companyAvatarText: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.primary },",
        "  companyName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },": "  companyName: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text },",
    }
    for old, new in replacements.items():
        text = text.replace(old, new, 1)
    path.write_text(text)


def paste_cover(src: Image.Image, size: tuple[int, int]) -> Image.Image:
    src = src.convert("RGBA")
    w, h = src.size
    tw, th = size
    scale = max(tw / w, th / h)
    resized = src.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - tw) // 2
    top = (resized.height - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def sync_android_resources() -> None:
    icon = Image.open(ROOT / "assets/icon.png")
    splash = Image.open(ROOT / "assets/icon.png")
    mip_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in mip_sizes.items():
        target_dir = ROOT / "android/app/src/main/res" / folder
        if target_dir.exists():
            for name in ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]:
                paste_cover(icon, (size, size)).save(target_dir / name)
    splash_sizes = {
        "drawable-mdpi": 80,
        "drawable-hdpi": 120,
        "drawable-xhdpi": 160,
        "drawable-xxhdpi": 240,
        "drawable-xxxhdpi": 320,
    }
    for folder, size in splash_sizes.items():
        target_dir = ROOT / "android/app/src/main/res" / folder
        if target_dir.exists():
            target = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            logo = paste_cover(splash, (int(size * 0.86), int(size * 0.86)))
            target.alpha_composite(logo, ((size - logo.width) // 2, (size - logo.height) // 2))
            target.save(target_dir / "splashscreen_logo.png")
    colors_path = ROOT / "android/app/src/main/res/values/colors.xml"
    if colors_path.exists():
        colors = colors_path.read_text()
        colors = colors.replace("#0ea5e9", "#061a44").replace("#ffffff", "#061a44", 1)
        colors_path.write_text(colors)


def main() -> None:
    patch_console()
    sync_android_resources()
    print("Console and Android native resources updated")


if __name__ == "__main__":
    main()
