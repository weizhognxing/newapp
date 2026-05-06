import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { authStore } from '../store/auth';
import PageHeader from '../components/PageHeader';
import { BorderRadius, Colors, FontSize, Gradients, Shadow, Spacing } from '../constants/theme';

import LoginScreen from '../screens/Login';
import TopicCenterScreen from '../screens/TopicCenter';
import HistoricalPlanningListScreen from '../screens/HistoricalPlanningList';
import HistoricalPlanningDetailScreen from '../screens/HistoricalPlanningDetail';
import RequirementInputScreen from '../screens/RequirementInput';
import TopicAccountSetupScreen from '../screens/TopicAccountSetup';
import GenerationListScreen from '../screens/GenerationList';
import PublishListScreen from '../screens/PublishList';
import CompanyInfoScreen from '../screens/CompanyInfo';
import StaffManageScreen from '../screens/StaffManage';
import AccountManageScreen from '../screens/AccountManage';
import MaterialManageScreen from '../screens/MaterialManage';
import DeviceManageScreen from '../screens/DeviceManage';
import CompanyManageScreen from '../screens/CompanyManage';
import PlatformConfigScreen from '../screens/PlatformConfig';
import DeviceMaintenanceScreen from '../screens/DeviceMaintenance';
import ConsoleDashboardScreen from '../screens/ConsoleDashboard';
import DivergenceResultScreen from '../screens/DivergenceResult';
import ThreadDetailScreen from '../screens/ThreadDetail';

const RootStack = createNativeStackNavigator();
const TopicStack = createNativeStackNavigator();
const HistoricalPlanningStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TopicStackNavigator() {
  return (
    <TopicStack.Navigator screenOptions={{ headerShown: false }}>
      <TopicStack.Screen name="TopicHotspotSelection" component={TopicCenterScreen} />
      <TopicStack.Screen name="RequirementInput" component={RequirementInputScreen} />
      <TopicStack.Screen name="TopicAccountSetup" component={TopicAccountSetupScreen} />
      <TopicStack.Screen name="DivergenceResult" component={DivergenceResultScreen} />
    </TopicStack.Navigator>
  );
}

function HistoricalPlanningStackNavigator() {
  return (
    <HistoricalPlanningStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoricalPlanningStack.Screen name="HistoricalPlanningList" component={HistoricalPlanningListScreen} />
      <HistoricalPlanningStack.Screen name="HistoricalPlanningDetail" component={HistoricalPlanningDetailScreen} />
    </HistoricalPlanningStack.Navigator>
  );
}

function SettingsHomeScreen({ navigation }: any) {
  const isPlatformAdmin = authStore.isPlatformAdmin();
  const items = useMemo(
    () => [
      { label: '公司信息', desc: '品牌与企业资料', icon: 'business-outline', route: 'CompanyInfo', color: Colors.primary },
      { label: '人员管理', desc: '团队成员与角色', icon: 'people-outline', route: 'StaffManage', color: Colors.success },
      { label: '账号管理', desc: '发布账号资产', icon: 'key-outline', route: 'AccountManage', color: Colors.accent },
      { label: '素材管理', desc: '营销知识与素材库', icon: 'albums-outline', route: 'MaterialManage', color: Colors.violet },
      { label: '设备管理', desc: '终端设备与状态', icon: 'phone-portrait-outline', route: 'DeviceManage', color: Colors.warning },
      ...(isPlatformAdmin
        ? [
            { label: '控制台', desc: '平台经营概览', icon: 'grid-outline', route: 'ConsoleDashboard', color: Colors.primaryDark },
            { label: '公司管理', desc: '租户与组织配置', icon: 'briefcase-outline', route: 'CompanyManage', color: Colors.accentDark },
            { label: '平台配置', desc: '渠道与基础能力', icon: 'options-outline', route: 'PlatformConfig', color: Colors.violet },
            { label: '设备维护', desc: '运维巡检与保障', icon: 'construct-outline', route: 'DeviceMaintenance', color: Colors.danger },
          ]
        : []),
    ],
    [isPlatformAdmin]
  );

  return (
    <View style={styles.settingsContainer}>
      <PageHeader title="设置" subtitle="统一管理营销增长配置" />
      <ScrollView contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.settingsHero}>
          <View style={styles.heroGlow} />
          <Text style={styles.heroEyebrow}>MARKETING CONTROL</Text>
          <Text style={styles.heroTitle}>增长运营中心</Text>
          <Text style={styles.heroDesc}>集中配置企业信息、账号矩阵、素材资产与平台能力，让团队协作更高效。</Text>
        </LinearGradient>
        <View style={styles.settingsGrid}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.settingsCard}
              activeOpacity={0.84}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.settingsIcon, { backgroundColor: `${item.color}18` }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.settingsCardText}>{item.label}</Text>
              <Text style={styles.settingsCardDesc}>{item.desc}</Text>
              <View style={styles.settingsArrow}>
                <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <SettingsStack.Screen name="CompanyInfo" component={CompanyInfoScreen} />
      <SettingsStack.Screen name="StaffManage" component={StaffManageScreen} />
      <SettingsStack.Screen name="AccountManage" component={AccountManageScreen} />
      <SettingsStack.Screen name="MaterialManage" component={MaterialManageScreen} />
      <SettingsStack.Screen name="DeviceManage" component={DeviceManageScreen} />
      <SettingsStack.Screen name="ConsoleDashboard" component={ConsoleDashboardScreen} />
      <SettingsStack.Screen name="CompanyManage" component={CompanyManageScreen} />
      <SettingsStack.Screen name="PlatformConfig" component={PlatformConfigScreen} />
      <SettingsStack.Screen name="DeviceMaintenance" component={DeviceMaintenanceScreen} />
    </SettingsStack.Navigator>
  );
}

function MainTabNavigator() {
  const iconMap: Record<string, any> = {
    TopicTab: require('../../assets/topic_center_outline.png'),
    HistoricalPlanningTab: require('../../assets/titlehub.png'),
    GenerationListTab: require('../../assets/generate_list_outline.png'),
    PublishTab: require('../../assets/publish_list_outline.png'),
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          height: 68,
          paddingTop: 8,
          paddingBottom: 10,
          marginHorizontal: Spacing.md,
          marginBottom: 0,
          borderRadius: BorderRadius.xl,
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(37, 99, 235, 0.10)',
          position: 'absolute',
          ...Shadow.lg,
        },
        tabBarItemStyle: {
          borderRadius: BorderRadius.lg,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconSource = iconMap[route.name] || iconMap.TopicTab;
          return (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Image
                source={iconSource}
                style={{ width: size, height: size, tintColor: color }}
                resizeMode="contain"
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="TopicTab" component={TopicStackNavigator} options={{ title: '选题中心' }} />
      <Tab.Screen name="HistoricalPlanningTab" component={HistoricalPlanningStackNavigator} options={{ title: '选题库' }} />
      <Tab.Screen name="GenerationListTab" component={GenerationListScreen} options={{ title: '生成列表' }} />
      <Tab.Screen name="PublishTab" component={PublishListScreen} options={{ title: '发布列表' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(() => {
    setIsAuthenticated(authStore.isAuthenticated());
  }, []);

  useEffect(() => {
    const init = async () => {
      await authStore.initialize();
      checkAuth();
      setIsLoading(false);
    };

    init();
    const unsubscribe = authStore.subscribe(checkAuth);
    return () => {
      unsubscribe();
    };
  }, [checkAuth]);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
            <RootStack.Screen name="ThreadDetail" component={ThreadDetailScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  settingsContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  settingsContent: {
    padding: Spacing.lg,
    paddingBottom: 108,
  },
  settingsHero: {
    minHeight: 156,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadow.brand,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -44,
    top: -58,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: FontSize.xs,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    color: Colors.textInverse,
    fontSize: FontSize.xxxl,
    fontWeight: '900',
    marginBottom: Spacing.sm,
  },
  heroDesc: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: FontSize.sm,
    lineHeight: 20,
    maxWidth: 290,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  settingsCard: {
    width: '48%',
    minHeight: 142,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    position: 'relative',
    ...Shadow.md,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  settingsCardText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  settingsCardDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 17,
    marginTop: 4,
  },
  settingsArrow: {
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrap: {
    width: 36,
    height: 28,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapActive: {
    backgroundColor: Colors.primaryBg,
  },
});
