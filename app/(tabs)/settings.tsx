/**
 * 設定 — Phase 0 プレースホルダ。
 * Phase 4.5 でテーマ切替 / 通知 / 課金復元 / データ管理 / 規約・プライバシーに差し替える。
 */
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, sumi, typography, washi } from '@/lib/theme';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.title}>設定</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: washi.base },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.title, color: sumi.ink },
});
