import { Alert } from 'react-native';
import { authApi } from '../api/auth';

export function confirmLogout() {
  Alert.alert('退出登录', '确定要退出当前账号吗？', [
    { text: '取消', style: 'cancel' },
    {
      text: '退出',
      style: 'destructive',
      onPress: async () => {
        try {
          await authApi.logout();
        } catch (error: any) {
          Alert.alert('退出失败', error?.message || '请稍后重试');
        }
      },
    },
  ]);
}
