/**
 * 和ストリーク — ルート Stack レイアウト
 *
 * 現状は (tabs) のみ。Phase 1 以降で onboarding ゲート / habit 詳細 /
 * milestone モーダル / paywall を追加する（プランの画面構成を参照）。
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
