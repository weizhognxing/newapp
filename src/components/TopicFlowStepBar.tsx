import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, FontSize, Spacing } from '../constants/theme';

const STEPS = [
  { key: 1, label: '选热点' },
  { key: 2, label: '选账号' },
  { key: 3, label: '选题生成' },
];

interface TopicFlowStepBarProps {
  currentStep: 1 | 2 | 3;
}

export default function TopicFlowStepBar({ currentStep }: TopicFlowStepBarProps) {
  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const active = step.key === currentStep;
        const done = step.key < currentStep;
        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, active && styles.stepCircleActive, done && styles.stepCircleDone]}>
                <Text style={[styles.stepCircleText, (active || done) && styles.stepCircleTextActive]}>
                  {done ? '✓' : step.key}
                </Text>
              </View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive, done && styles.stepLabelDone]}>
                {step.label}
              </Text>
            </View>
            {index < STEPS.length - 1 ? <View style={[styles.connector, step.key < currentStep && styles.connectorDone]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepItem: {
    alignItems: 'center',
    width: 68,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepCircleDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepCircleText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  stepCircleTextActive: {
    color: Colors.textInverse,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  stepLabelDone: {
    color: Colors.success,
    fontWeight: '600',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.xs,
    marginBottom: 18,
  },
  connectorDone: {
    backgroundColor: Colors.success,
  },
});
