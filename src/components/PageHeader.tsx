import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { BorderRadius, Colors, Gradients, Spacing, FontSize, Shadow } from '../constants/theme';
import { confirmLogout } from '../utils/authActions';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showMenu?: boolean;
  hideBack?: boolean;
  hideLogout?: boolean;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
  rightComponent?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  onBack,
  showMenu = false,
  hideBack = false,
  hideLogout = false,
  rightAction,
  rightComponent,
}: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const openDrawer = () => {
    let currentNav = navigation;

    while (currentNav) {
      try {
        currentNav.dispatch(DrawerActions.openDrawer());
        return;
      } catch (e) {
        currentNav = currentNav.getParent?.();
      }
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const routeOptions = [
      { name: 'TopicTab' as const },
      { name: 'MainTabs' as const, params: { screen: 'TopicTab' } },
    ];

    let currentNav: any = navigation;
    while (currentNav) {
      for (const option of routeOptions) {
        try {
          currentNav.navigate(option.name, option.params as any);
          return;
        } catch (e) {
          // Try parent navigators until a matching route is found.
        }
      }
      currentNav = currentNav.getParent?.();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}> 
      <LinearGradient colors={Gradients.brandSoft} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.decorCircleLeft} />
      <View style={styles.decorCircleRight} />
      <View style={styles.content}>
        {hideBack ? <View style={styles.backPlaceholder} /> : (
          <TouchableOpacity activeOpacity={0.82} onPress={showMenu ? openDrawer : handleBack} style={styles.menuButton}>
            <Ionicons name={showMenu ? 'menu' : 'chevron-back'} size={18} color={Colors.primaryDark} />
            <Text style={styles.actionText}>{showMenu ? '菜单' : '返回'}</Text>
          </TouchableOpacity>
        )}
        {showMenu && hideBack ? (
          <TouchableOpacity activeOpacity={0.82} onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu" size={18} color={Colors.primaryDark} />
            <Text style={styles.actionText}>菜单</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <View style={styles.rightActions}>
          {rightComponent}
          {rightAction && (
            <TouchableOpacity activeOpacity={0.82} onPress={rightAction.onPress} style={styles.rightButton}>
              <Ionicons name={rightAction.icon as any} size={18} color={Colors.primaryDark} />
            </TouchableOpacity>
          )}
          {!hideLogout ? (
            <TouchableOpacity activeOpacity={0.82} onPress={confirmLogout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={18} color={Colors.primaryDark} />
              <Text style={styles.actionText}>退出</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <LinearGradient colors={['rgba(37,99,235,0)', 'rgba(37,99,235,0.18)', 'rgba(6,182,212,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bottomGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  decorCircleLeft: {
    position: 'absolute',
    left: -68,
    top: -56,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(37, 99, 235, 0.10)',
  },
  decorCircleRight: {
    position: 'absolute',
    right: -42,
    bottom: -76,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(6, 182, 212, 0.13)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    minHeight: 48,
    position: 'relative',
  },
  menuButton: {
    marginRight: Spacing.sm,
    minWidth: 66,
    height: 36,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.16)',
    ...Shadow.sm,
  },
  backPlaceholder: {
    minWidth: 66,
    marginRight: Spacing.sm,
  },
  titleContainer: {
    position: 'absolute',
    left: 96,
    right: 96,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  rightActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rightButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.16)',
    ...Shadow.sm,
  },
  logoutButton: {
    minWidth: 66,
    height: 36,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.16)',
    ...Shadow.sm,
  },
  actionText: {
    color: Colors.primaryDark,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  bottomGlow: {
    height: 2,
  },
});
