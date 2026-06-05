/**
 * 和ストリーク — ルート Stack レイアウト
 *
 * (tabs)         — ホーム / 設定
 * habit/[id]     — 習慣詳細（貢献グリッド・ストリーク・チェックイン）
 * habit/edit     — 習慣の追加 / 編集
 * Phase 2 以降で milestone モーダル / paywall を追加する。
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { HabitsProvider } from '@/lib/habits-store';
import { sumi, washi } from '@/lib/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <HabitsProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: washi.base },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="habit/[id]"
            options={{
              headerShown: true,
              headerTitle: '',
              headerTintColor: sumi.ink,
              headerStyle: { backgroundColor: washi.base },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="habit/edit"
            options={{
              headerShown: true,
              headerTitle: '習慣',
              headerTintColor: sumi.ink,
              headerStyle: { backgroundColor: washi.base },
              headerShadowVisible: false,
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </HabitsProvider>
    </SafeAreaProvider>
  );
}
