/**
 * 習慣詳細。フルサイズ貢献グリッド + 現ストリーク（大・レベル色）+ 最長 + 達成率 +
 * チェックイン/取消 + 編集/削除。Phase 2 でストリーク表示を StreakLamp（7段階演出）に、
 * 絵柄を GrowingVisual に差し替える。
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContributionGrid } from '@/components/ContributionGrid';
import { diffDays, todayStr } from '@/lib/date';
import { useHabits } from '@/lib/habits-store';
import { radius, seasons, spacing, streakLevels, sumi, typography, washi } from '@/lib/theme';

export default function HabitDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getHabit, toggleToday, removeHabit } = useHabits();
  const [busy, setBusy] = useState(false);

  const habit = id ? getHabit(id) : undefined;

  if (!habit) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>習慣が見つからなかったよ。</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  const lv = streakLevels[habit.level];
  const palette = seasons[habit.themeColor];

  const createdDate = habit.createdAt.slice(0, 10);
  const daysSince = Math.max(1, diffDays(todayStr(), createdDate) + 1);
  const completion = Math.round((habit.checkInDates.length / daysSince) * 100);

  const onToggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await toggleToday(habit.id);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    Alert.alert('この習慣を削除する？', `「${habit.name}」と記録がすべて消えるよ。`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除する',
        style: 'destructive',
        onPress: async () => {
          await removeHabit(habit.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerRight: () => (
            <Pressable
              onPress={() => router.push({ pathname: '/habit/edit', params: { id: habit.id } })}
              hitSlop={8}>
              <Text style={styles.editLink}>編集</Text>
            </Pressable>
          ),
        }}
      />

      <Text style={styles.name}>{habit.name}</Text>

      {/* 現ストリーク（大・レベル色のグロー土台。Phase 2 で StreakLamp 演出に差し替え） */}
      <View style={styles.streakHero}>
        <View style={[styles.glow, { backgroundColor: lv.color, opacity: 0.12 + lv.glow * 0.12 }]} />
        <Text style={[styles.streakNum, { color: lv.color }]}>{habit.currentStreak}</Text>
        <Text style={styles.streakUnit}>日連続</Text>
        <View style={styles.levelPill}>
          <View style={[styles.levelDot, { backgroundColor: lv.color }]} />
          <Text style={styles.levelText}>
            {lv.label}・{lv.growth}
          </Text>
        </View>
      </View>

      {/* 統計 */}
      <View style={styles.stats}>
        <Stat label="最長" value={`${habit.longestStreak}日`} />
        <View style={styles.statDivider} />
        <Stat label="達成率" value={`${completion}%`} />
        <View style={styles.statDivider} />
        <Stat label="記録" value={`${habit.checkInDates.length}回`} />
      </View>

      {/* 貢献グリッド（フルサイズ） */}
      <Text style={styles.sectionLabel}>これまでの歩み</Text>
      <View style={styles.gridWrap}>
        <ContributionGrid checkInDates={habit.checkInDates} season={habit.themeColor} weeks={17} cell={13} gap={3} />
      </View>

      {/* チェックイン */}
      <Pressable
        onPress={onToggle}
        style={[
          styles.checkCta,
          habit.todayChecked
            ? { backgroundColor: 'transparent', borderColor: palette.deep }
            : { backgroundColor: palette.primary, borderColor: palette.deep },
        ]}>
        <Text style={[styles.checkCtaText, habit.todayChecked ? { color: palette.deep } : { color: washi.base }]}>
          {habit.todayChecked ? '今日の記録を取り消す' : '今日を達成にする'}
        </Text>
      </Pressable>

      <Pressable onPress={onDelete} style={styles.delete}>
        <Text style={styles.deleteText}>この習慣を削除</Text>
      </Pressable>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: washi.base },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: washi.base, padding: spacing.xl },
  notFound: { ...typography.body, color: sumi.stone },
  backLink: { marginTop: spacing.lg },
  backLinkText: { ...typography.body, color: sumi.ink, fontWeight: '600' },

  editLink: { ...typography.body, color: sumi.ink, fontWeight: '600' },
  name: { ...typography.title, color: sumi.ink, marginBottom: spacing.lg },

  streakHero: { alignItems: 'center', paddingVertical: spacing.xl },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: 0 },
  streakNum: { fontSize: 84, fontWeight: '800', letterSpacing: -2 },
  streakUnit: { ...typography.body, color: sumi.stone, marginTop: -spacing.sm },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: washi.warm,
  },
  levelDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  levelText: { ...typography.caption, color: sumi.stone },

  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: washi.warm,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.heading, color: sumi.ink },
  statLabel: { ...typography.caption, color: sumi.faint, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: washi.shadow },

  sectionLabel: { ...typography.caption, color: sumi.stone, marginTop: spacing.xl, marginBottom: spacing.sm },
  gridWrap: { backgroundColor: washi.warm, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },

  checkCta: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
  },
  checkCtaText: { ...typography.body, fontWeight: '700' },

  delete: { marginTop: spacing.xl, alignItems: 'center', paddingVertical: spacing.sm },
  deleteText: { ...typography.caption, color: seasons.momiji.deep },
});
