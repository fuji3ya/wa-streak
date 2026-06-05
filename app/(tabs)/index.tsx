/**
 * ホーム（習慣グリッド）。DB の習慣一覧を表示。空なら世界観のある空状態。
 * FAB で習慣追加。Phase 2 でカードを育つビジュアル + StreakLamp に差し替える。
 */
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HabitCard } from '@/components/HabitCard';
import { useHabits } from '@/lib/habits-store';
import { radius, seasons, spacing, sumi, typography, washi } from '@/lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { habits, loading } = useHabits();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.brand}>和ストリーク</Text>
        <Text style={styles.tagline}>継続を、美しく。</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={sumi.faint} />
        </View>
      ) : habits.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyMark} />
          <Text style={styles.emptyTitle}>最初の習慣を、ひとつ。</Text>
          <Text style={styles.emptyBody}>
            毎日つづけたいことを登録して、{'\n'}タップで一日を重ねていく。
          </Text>
          <Pressable style={styles.emptyCta} onPress={() => router.push('/habit/edit')}>
            <Text style={styles.emptyCtaText}>習慣をつくる</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(h) => h.id}
          renderItem={({ item }) => <HabitCard habit={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {habits.length > 0 ? (
        <Pressable style={styles.fab} onPress={() => router.push('/habit/edit')} hitSlop={8}>
          <View style={styles.fabPlusH} />
          <View style={styles.fabPlusV} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: washi.base },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  brand: { ...typography.title, color: sumi.ink },
  tagline: { ...typography.caption, color: sumi.faint, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },

  emptyMark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: seasons.sakura.primary,
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typography.heading, color: sumi.ink, marginBottom: spacing.sm },
  emptyBody: { ...typography.body, color: sumi.stone, textAlign: 'center', lineHeight: 24 },
  emptyCta: {
    marginTop: spacing.xl,
    backgroundColor: sumi.ink,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  emptyCtaText: { ...typography.body, color: washi.base, fontWeight: '600' },

  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: sumi.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: sumi.ink,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabPlusH: { position: 'absolute', width: 22, height: 2.5, borderRadius: 2, backgroundColor: washi.base },
  fabPlusV: { position: 'absolute', width: 2.5, height: 22, borderRadius: 2, backgroundColor: washi.base },
});
