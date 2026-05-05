import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSize, Gradients, Shadow, Spacing } from '../constants/theme';

interface BottomActionBarProps {
  summary: string;
  primaryLabel: string;
  onPrimaryPress: () => void;
  disabled?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  bottomOffset?: number;
}

export default function BottomActionBar({
  summary,
  primaryLabel,
  onPrimaryPress,
  disabled = false,
  secondaryLabel,
  onSecondaryPress,
  bottomOffset = 0,
}: BottomActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset + insets.bottom + 2 }]}> 
      <View style={styles.card}>
        <View style={styles.summaryBlock}>
          <Text style={styles.summaryLabel}>当前进度</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
        {secondaryLabel && onSecondaryPress ? (
          <TouchableOpacity activeOpacity={0.82} style={styles.secondaryButton} onPress={onSecondaryPress}>
            <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.primaryButton, disabled && styles.primaryButtonDisabled]}
          onPress={onPrimaryPress}
          disabled={disabled}
          activeOpacity={0.86}
        >
          <LinearGradient
            colors={disabled ? ['#cbd5e1', '#94a3b8'] : Gradients.primaryButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    transform: [{ translateY: 42 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.12)',
    ...Shadow.lg,
  },
  summaryBlock: {
    flex: 1,
    paddingLeft: Spacing.xs,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginBottom: 2,
    fontWeight: '700',
  },
  summaryText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '800',
  },
  secondaryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primarySoft,
  },
  secondaryButtonText: {
    color: Colors.primaryDark,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  primaryButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadow.brand,
  },
  primaryButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    minWidth: 92,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
});
