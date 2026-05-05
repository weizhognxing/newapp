import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api/auth';
import { Colors, Spacing, FontSize, BorderRadius, Gradients, Shadow } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  { icon: 'compass', title: '智能话题追踪', desc: '实时监测热点话题，把握营销先机' },
  { icon: 'bar-chart', title: '多维数据分析', desc: '深度洞察数据，驱动科学决策' },
  { icon: 'sparkles', title: 'AI 内容生成', desc: '智能创作高质量营销内容' },
  { icon: 'rocket', title: '智能发布', desc: '一键分发多平台，高效触达目标用户' },
];

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    slideTimer.current = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, 4000);

    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, []);

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('请输入账号');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authApi.login(username.trim(), password);

      if (!result.success) {
        throw new Error(result.message || '登录失败，请检查账号密码');
      }

      if (!result.token) {
        throw new Error('登录成功但未获取到 token');
      }

      await authApi.getCurrentUser();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.message ||
        '登录失败，请检查账号密码';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Gradients.hero}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.orbTop} />
        <View style={styles.orbBottom} />
        <View style={styles.gridLineOne} />
        <View style={styles.gridLineTwo} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.brandSection}>
              <View style={styles.logoContainer}>
                <Image source={require('../../../assets/icon.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.brandTitle}>康桥智推</Text>
              <Text style={styles.brandSubtitle}>AI 驱动的全域营销增长中枢</Text>
              <View style={styles.brandPills}>
                <Text style={styles.brandPill}>选题洞察</Text>
                <Text style={styles.brandPill}>智能生成</Text>
                <Text style={styles.brandPill}>多平台发布</Text>
              </View>

              <Animated.View style={[styles.featureCard, { opacity: fadeAnim }]}> 
                <View style={styles.featureIconWrap}>
                  <Ionicons name={slide.icon as any} size={28} color={Colors.primary} />
                </View>
                <Text style={styles.featureTitle}>{slide.title}</Text>
                <Text style={styles.featureDesc}>{slide.desc}</Text>
              </Animated.View>

              <View style={styles.dotsContainer}>
                {SLIDES.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      currentSlide === index && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.formEyebrow}>Smart Marketing OS</Text>
              <Text style={styles.formTitle}>欢迎登录</Text>
              <Text style={styles.formSubtitle}>登录账号，开启高效内容增长工作台</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>账号</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="请输入手机号/邮箱"
                    placeholderTextColor={Colors.textTertiary}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>密码</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={Colors.textTertiary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="请输入密码"
                    placeholderTextColor={Colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    activeOpacity={0.76}
                  >
                    <Ionicons
                      name={showPassword ? 'eye' : 'eye-off'}
                      size={20}
                      color={Colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.86}
              >
                <LinearGradient
                  colors={loading ? ['#94a3b8', '#94a3b8'] : Gradients.primaryButton}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>登 录</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.footerText}>请联系管理员获取账号</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  orbTop: {
    position: 'absolute',
    top: -110,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(34, 211, 238, 0.22)',
  },
  orbBottom: {
    position: 'absolute',
    left: -120,
    bottom: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
  },
  gridLineOne: {
    position: 'absolute',
    top: height * 0.18,
    left: -40,
    width: width + 120,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    transform: [{ rotate: '9deg' }],
  },
  gridLineTwo: {
    position: 'absolute',
    top: height * 0.30,
    left: -40,
    width: width + 120,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    transform: [{ rotate: '9deg' }],
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
    position: 'relative',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    ...Shadow.lg,
  },
  logoImage: {
    width: 62,
    height: 62,
  },
  brandTitle: {
    fontSize: FontSize.title,
    fontWeight: '900',
    color: '#fff',
    marginBottom: Spacing.xs,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.88)',
    marginBottom: Spacing.md,
  },
  brandPills: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  brandPill: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: FontSize.xs,
    fontWeight: '700',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    ...Shadow.lg,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryBg,
    marginBottom: Spacing.xs,
  },
  featureTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  featureDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 22,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.86)',
    ...Shadow.lg,
  },
  formEyebrow: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.2,
    marginBottom: Spacing.xs,
  },
  formTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xxl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    height: '100%',
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  loginButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...Shadow.brand,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonGradient: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
