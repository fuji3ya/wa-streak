/**
 * 習慣カード（ホーム用）。名前 + 現ストリーク + レベル + 縮小貢献グリッド +
 * 今日のチェックボタン。タップで詳細へ。チェックは DB をトグルして即再算出。
 * Phase 2 で StreakLamp（7段階エスカレーション）と GrowingVisual に差し替える。
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContributionGrid } from '@/components/ContributionGrid';
import { useHabits, type HabitView } from '@/lib/habits-store';
import { radius, seasons, spacing, streakLevels, sumi, typography, washi } from '@/lib/theme';

export function HabitCard({ habit }: { habit: HabitView }) {
  const router = useRouter();
  const { toggleToday } = useHabits();
  const [busy, setBusy] = useState(false);
  const lv = streakLevels[habit.level];
  const palette = seasons[habit.themeColor];

  const onToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await toggleToday(habit.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.name} numberOfLines={1}>
            {habit.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.levelDot, { backgroundColor: lv.color }]} />
            <Text style={styles.streak}>{habit.currentStreak}</Text>
            <Text style={styles.streakUnit}>日</Text>
            <Text style={styles.levelLabel}>· {lv.label}</Text>
          </View>
        </View>

        <Pressable
          onPress={onToggle}
          hitSlop={10}
          style={[
            styles.checkBtn,
            habit.todayChecked
              ? { backgroundColor: palette.primary, borderColor: palette.deep }
              : { backgroundColor: 'transparent', borderColor: sumi.faint },
          ]}>
          {habit.todayChecked ? <View style={styles.checkInner} /> : null}
        </Pressable>
      </View>

      <View style={styles.grid}>
        <ContributionGrid
          checkInDates={habit.checkInDates}
          season={habit.themeColor}
          weeks={8}
          cell={11}
          gap={3}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: washi.warm,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: washi.shadow,
  },
  cardPressed: { opacity: 0.85 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleBlock: { flex: 1, paddingRight: spacing.md },
  name: { ...typography.heading, color: sumi.ink },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  levelDot: { width: 9, height: 9, borderRadius: 5, marginRight: spacing.sm },
  streak: { ...typography.title, color: sumi.ink },
  streakUnit: { ...typography.caption, color: sumi.stone, marginLeft: 2 },
  levelLabel: { ...typography.caption, color: sumi.faint, marginLeft: spacing.sm },
  checkBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: { width: 16, height: 16, borderRadius: 8, backgroundColor: washi.base },
  grid: { marginTop: spacing.md },
});

export default HabitCard;
