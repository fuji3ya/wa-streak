/**
 * 習慣の追加 / 編集。?id があれば編集、無ければ新規。
 * 保存は DB に書き込み（addHabit/editHabit）→ ストア reload → 戻る。
 */
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useHabits } from '@/lib/habits-store';
import { radius, seasons, spacing, sumi, typography, washi, type SeasonKey } from '@/lib/theme';
import type { Emblem, FrequencyType, HabitInput } from '@/lib/types';

const EMBLEMS: { key: Emblem; label: string }[] = [
  { key: 'bonsai', label: '盆栽' },
  { key: 'fire', label: '炎' },
  { key: 'season', label: '季節' },
  { key: 'sumi', label: '墨丸' },
];

const SEASON_KEYS: SeasonKey[] = ['sakura', 'ai', 'momiji', 'yukinezu'];

const FREQS: { key: FrequencyType; label: string }[] = [
  { key: 'daily', label: '毎日' },
  { key: 'weekdays', label: '曜日指定' },
  { key: 'weekly_n', label: '週N回' },
];

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export default function HabitEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getHabit, addHabit, editHabit } = useHabits();
  const existing = id ? getHabit(id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [emblem, setEmblem] = useState<Emblem>(existing?.emblem ?? 'bonsai');
  const [season, setSeason] = useState<SeasonKey>(existing?.themeColor ?? 'sakura');
  const [freqType, setFreqType] = useState<FrequencyType>(existing?.frequencyType ?? 'daily');

  const [weekdays, setWeekdays] = useState<Set<number>>(() => {
    if (existing?.frequencyType === 'weekdays' && existing.frequencyValue) {
      return new Set(existing.frequencyValue.split(',').map(Number));
    }
    return new Set([1, 2, 3, 4, 5]);
  });

  const [weeklyN, setWeeklyN] = useState<number>(() => {
    if (existing?.frequencyType === 'weekly_n' && existing.frequencyValue) {
      return Math.min(7, Math.max(1, parseInt(existing.frequencyValue, 10) || 3));
    }
    return 3;
  });

  const initialReminder = existing?.reminderTime ?? null;
  const [reminderOn, setReminderOn] = useState(initialReminder != null);
  const [reminderH, setReminderH] = useState(() =>
    initialReminder ? parseInt(initialReminder.split(':')[0], 10) : 21,
  );
  const [reminderM, setReminderM] = useState(() =>
    initialReminder ? parseInt(initialReminder.split(':')[1], 10) : 0,
  );

  const nameValid = name.trim().length > 0;
  const freqValid = freqType !== 'weekdays' || weekdays.size > 0;
  const canSave = nameValid && freqValid;

  const reminderTime = useMemo(
    () =>
      reminderOn
        ? `${String(reminderH).padStart(2, '0')}:${String(reminderM).padStart(2, '0')}`
        : null,
    [reminderOn, reminderH, reminderM],
  );

  const toggleDow = (d: number) => {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  const onSave = async () => {
    if (!canSave) return;
    const frequencyValue =
      freqType === 'weekdays'
        ? [...weekdays].sort((a, b) => a - b).join(',')
        : freqType === 'weekly_n'
          ? String(weeklyN)
          : null;

    const input: HabitInput = {
      name: name.trim(),
      emblem,
      themeColor: season,
      frequencyType: freqType,
      frequencyValue,
      reminderTime,
    };

    if (id && existing) await editHabit(id, input);
    else await addHabit(input);
    router.back();
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerTitle: id ? '習慣を編集' : '習慣をつくる' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* 名前 */}
        <Text style={styles.label}>名前</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="例：朝のストレッチ"
          placeholderTextColor={sumi.faint}
          style={styles.input}
          maxLength={40}
        />

        {/* 絵柄 */}
        <Text style={styles.label}>絵柄</Text>
        <View style={styles.chipRow}>
          {EMBLEMS.map((e) => (
            <Chip key={e.key} active={emblem === e.key} label={e.label} onPress={() => setEmblem(e.key)} />
          ))}
        </View>

        {/* 季節色 */}
        <Text style={styles.label}>季節色</Text>
        <View style={styles.chipRow}>
          {SEASON_KEYS.map((k) => {
            const p = seasons[k];
            const active = season === k;
            return (
              <Pressable
                key={k}
                onPress={() => setSeason(k)}
                style={[
                  styles.seasonChip,
                  { backgroundColor: p.tint, borderColor: active ? p.deep : 'transparent' },
                ]}>
                <View style={[styles.seasonDot, { backgroundColor: p.primary }]} />
                <Text style={[styles.seasonLabel, active && { color: p.deep, fontWeight: '700' }]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 頻度 */}
        <Text style={styles.label}>頻度</Text>
        <View style={styles.chipRow}>
          {FREQS.map((f) => (
            <Chip key={f.key} active={freqType === f.key} label={f.label} onPress={() => setFreqType(f.key)} />
          ))}
        </View>

        {freqType === 'weekdays' ? (
          <View style={styles.dowRow}>
            {DOW_LABELS.map((lbl, d) => {
              const on = weekdays.has(d);
              return (
                <Pressable
                  key={d}
                  onPress={() => toggleDow(d)}
                  style={[styles.dow, on ? styles.dowOn : styles.dowOff]}>
                  <Text style={[styles.dowText, on && { color: washi.base }]}>{lbl}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {freqType === 'weekly_n' ? (
          <View style={styles.stepperRow}>
            <Stepper value={weeklyN} min={1} max={7} onChange={setWeeklyN} />
            <Text style={styles.stepperUnit}>回 / 週</Text>
          </View>
        ) : null}

        {/* リマインダー */}
        <View style={styles.reminderHead}>
          <Text style={styles.label}>リマインダー</Text>
          <Pressable
            onPress={() => setReminderOn((v) => !v)}
            style={[styles.toggle, reminderOn ? styles.toggleOn : styles.toggleOff]}>
            <View style={[styles.knob, reminderOn ? styles.knobOn : styles.knobOff]} />
          </Pressable>
        </View>
        {reminderOn ? (
          <View style={styles.stepperRow}>
            <Stepper value={reminderH} min={0} max={23} pad onChange={setReminderH} />
            <Text style={styles.colon}>:</Text>
            <Stepper value={reminderM} min={0} max={55} step={5} pad onChange={setReminderM} />
          </View>
        ) : null}

        <Pressable
          onPress={onSave}
          disabled={!canSave}
          style={[styles.save, !canSave && styles.saveDisabled]}>
          <Text style={styles.saveText}>{id ? '保存する' : 'つくる'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipOn : styles.chipOff]}>
      <Text style={[styles.chipText, active && { color: washi.base, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

function Stepper({
  value,
  min,
  max,
  step = 1,
  pad = false,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  pad?: boolean;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <View style={styles.stepper}>
      <Pressable onPress={dec} hitSlop={8} style={styles.stepBtn}>
        <View style={styles.stepMinus} />
      </Pressable>
      <Text style={styles.stepValue}>{pad ? String(value).padStart(2, '0') : value}</Text>
      <Pressable onPress={inc} hitSlop={8} style={styles.stepBtn}>
        <View style={styles.stepMinus} />
        <View style={styles.stepPlusV} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: washi.base },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { ...typography.caption, color: sumi.stone, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    ...typography.body,
    color: sumi.ink,
    backgroundColor: washi.warm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: washi.shadow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipOn: { backgroundColor: sumi.ink, borderColor: sumi.ink },
  chipOff: { backgroundColor: 'transparent', borderColor: washi.shadow },
  chipText: { ...typography.body, color: sumi.stone },

  seasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  seasonDot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.sm },
  seasonLabel: { ...typography.body, color: sumi.stone },

  dowRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  dow: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  dowOn: { backgroundColor: sumi.ink, borderColor: sumi.ink },
  dowOff: { backgroundColor: 'transparent', borderColor: washi.shadow },
  dowText: { ...typography.body, color: sumi.stone },

  stepperRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.md },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: washi.warm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: washi.shadow,
  },
  stepBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepMinus: { position: 'absolute', width: 14, height: 2.5, borderRadius: 2, backgroundColor: sumi.ink },
  stepPlusV: { position: 'absolute', width: 2.5, height: 14, borderRadius: 2, backgroundColor: sumi.ink },
  stepValue: { ...typography.heading, color: sumi.ink, minWidth: 34, textAlign: 'center' },
  stepperUnit: { ...typography.body, color: sumi.stone },
  colon: { ...typography.heading, color: sumi.ink },

  reminderHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { width: 50, height: 30, borderRadius: 15, padding: 3, marginTop: spacing.lg },
  toggleOn: { backgroundColor: sumi.ink },
  toggleOff: { backgroundColor: washi.shadow },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: washi.base },
  knobOn: { alignSelf: 'flex-end' },
  knobOff: { alignSelf: 'flex-start' },

  save: {
    marginTop: spacing.xxl,
    backgroundColor: sumi.ink,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  saveDisabled: { backgroundColor: sumi.faint, opacity: 0.6 },
  saveText: { ...typography.body, color: washi.base, fontWeight: '700' },
});
