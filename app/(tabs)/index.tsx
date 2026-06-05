/**
 * ホーム（習慣グリッド）— Phase 0 プレースホルダ。
 * Phase 1.4 で習慣カード一覧 + 貢献グリッド縮小版 + FAB に差し替える。
 */
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, sumi, typography, washi } from '@/lib/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.title}>和ストリーク</Text>
        <Text style={styles.sub}>継続を、美しく。</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: washi.base },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.display, color: sumi.ink },
  sub: { ...typography.body, color: sumi.faint, marginTop: spacing.sm },
});
