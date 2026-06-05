/**
 * タブレイアウト — ホーム / 設定
 * Phase 1 でホームを習慣グリッドに、設定を本実装に差し替える。
 */
import { Tabs } from 'expo-router';

import { sumi, washi } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: sumi.ink,
        tabBarInactiveTintColor: sumi.faint,
        tabBarStyle: { backgroundColor: washi.warm },
      }}>
      <Tabs.Screen name="index" options={{ title: 'ホーム' }} />
      <Tabs.Screen name="settings" options={{ title: '設定' }} />
    </Tabs>
  );
}
