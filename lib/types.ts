/**
 * 和ストリーク — ドメイン型。DB 行（snake_case）とアプリ型（camelCase）の橋渡し。
 */
import type { Frequency, FrequencyType } from '@/lib/streak';
import type { SeasonKey } from '@/lib/theme';

export type { FrequencyType, SeasonKey };

/** 習慣の絵柄（育つビジュアルのモチーフ） */
export type Emblem = 'fire' | 'bonsai' | 'season' | 'sumi';

export interface Habit {
  id: string;
  name: string;
  emblem: Emblem;
  /** 季節色キー（lib/theme.ts seasons） */
  themeColor: SeasonKey;
  frequencyType: FrequencyType;
  /** weekdays: '1,3,5' / weekly_n: '3' / daily: null */
  frequencyValue: string | null;
  /** 'HH:mm' or null */
  reminderTime: string | null;
  sortOrder: number;
  archived: boolean;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  habitId: string;
  /** 'YYYY-MM-DD'（ローカル） */
  date: string;
  createdAt: string;
}

/** 習慣の新規作成入力（id / sortOrder / createdAt は db 側で補完） */
export type HabitInput = Pick<
  Habit,
  'name' | 'emblem' | 'themeColor' | 'frequencyType' | 'frequencyValue' | 'reminderTime'
>;

/** Habit → streak 計算用の Frequency に変換 */
export function habitFrequency(h: Pick<Habit, 'frequencyType' | 'frequencyValue'>): Frequency {
  return { type: h.frequencyType, value: h.frequencyValue };
}
