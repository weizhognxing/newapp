import React, { useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import PageHeader from '../../components/PageHeader';
import BottomActionBar from '../../components/BottomActionBar';
import { BorderRadius, Colors, FontSize, Shadow, Spacing } from '../../constants/theme';

const ACTION_BAR_HEIGHT = 104;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function RequirementInputScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const tabBarHeight = useBottomTabBarHeight();
  const selectedTopics = route.params?.selectedTopics || [];
  const inputRef = useRef<TextInput>(null);

  const [requirement, setRequirement] = useState(route.params?.userRequirement || '');

  const canNext = useMemo(() => selectedTopics.length > 0, [selectedTopics.length]);

  const handleNext = () => {
    if (!selectedTopics.length) {
      Alert.alert('提示', '请先选择热点');
      navigation.goBack();
      return;
    }

    navigation.navigate('TopicAccountSetup', {
      selectedTopics,
      userRequirement: requirement.trim(),
    });
  };

  return (
    <View style={styles.container}>
      <PageHeader title="写作要求" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={styles.card}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            multiline
            value={requirement}
            onChangeText={setRequirement}
            placeholder="语音输入写作要求，比如：围绕行业热点写一篇专业但通俗的分析"
            placeholderTextColor={Colors.textTertiary}
            editable
            showSoftInputOnFocus
            onPressIn={() => inputRef.current?.focus()}
          />
        </View>
      </View>

      <BottomActionBar
        summary="填写写作要求后进入账号选择"
        primaryLabel="下一步"
        onPrimaryPress={handleNext}
        disabled={!canNext}
        secondaryLabel="上一步"
        onSecondaryPress={() => navigation.goBack()}
        bottomOffset={tabBarHeight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    paddingBottom: ACTION_BAR_HEIGHT + Spacing.xxxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  input: {
    height: Math.round(SCREEN_HEIGHT * 0.46),
    minHeight: 220,
    maxHeight: 420,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    color: Colors.text,
    textAlignVertical: 'top',
    fontSize: FontSize.md,
    lineHeight: 22,
  },
});
