/**
 * 和ストリーク — 習慣ストア（React Context）。
 * SQLite を単一の真実源として読み、派生ストリーク（current/longest/level/today）を
 * 算出して全画面に供給する。ミューテーション後は reload して整合を保つ
 * （端末内の小規模データなので全再読込で十分・不整合の温床を作らない）。
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { todayStr } from '@/lib/date';
import * as db from '@/lib/db';
import { calcCurrentStreak, calcLongestStreak, streakToLevel, type Level } from '@/lib/streak';
import { habitFrequency, type Habit, type HabitInput } from '@/lib/types';

export interface HabitView extends Habit {
  checkInDates: string[];
  currentStreak: number;
  longestStreak: number;
  level: Level;
  todayChecked: boolean;
}

interface HabitsContextValue {
  habits: HabitView[];
  loading: boolean;
  reload: () => Promise<void>;
  addHabit: (input: HabitInput) => Promise<void>;
  editHabit: (id: string, input: HabitInput) => Promise<void>;
  removeHabit: (id: string) => Promise<void>;
  archiveHabit: (id: string) => Promise<void>;
  /** 今日のチェックインをトグル。返り値はトグル後にチェック済みか */
  toggleToday: (id: string) => Promise<boolean>;
  toggleDate: (id: string, date: string) => Promise<boolean>;
  getHabit: (id: string) => HabitView | undefined;
}

const HabitsContext = createContext<HabitsContextValue | null>(null);

function toView(h: Habit, dates: string[], today: string): HabitView {
  const freq = habitFrequency(h);
  const currentStreak = calcCurrentStreak(dates, freq, today);
  return {
    ...h,
    checkInDates: dates,
    currentStreak,
    longestStreak: calcLongestStreak(dates, freq),
    level: streakToLevel(currentStreak),
    todayChecked: dates.includes(today),
  };
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<HabitView[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const today = todayStr();
    const list = await db.listHabits(false);
    const views = await Promise.all(
      list.map(async (h) => toView(h, await db.listCheckInDates(h.id), today)),
    );
    setHabits(views);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload().catch((e) => {
      console.error('[habits-store] initial load failed', e);
      setLoading(false);
    });
  }, [reload]);

  const addHabit = useCallback(
    async (input: HabitInput) => {
      await db.createHabit(input);
      await reload();
    },
    [reload],
  );

  const editHabit = useCallback(
    async (id: string, input: HabitInput) => {
      await db.updateHabit(id, input);
      await reload();
    },
    [reload],
  );

  const removeHabit = useCallback(
    async (id: string) => {
      await db.deleteHabit(id);
      await reload();
    },
    [reload],
  );

  const archiveHabit = useCallback(
    async (id: string) => {
      await db.archiveHabit(id, true);
      await reload();
    },
    [reload],
  );

  const toggleToday = useCallback(
    async (id: string) => {
      const now = await db.toggleCheckIn(id, todayStr());
      await reload();
      return now;
    },
    [reload],
  );

  const toggleDate = useCallback(
    async (id: string, date: string) => {
      const now = await db.toggleCheckIn(id, date);
      await reload();
      return now;
    },
    [reload],
  );

  const value = useMemo<HabitsContextValue>(
    () => ({
      habits,
      loading,
      reload,
      addHabit,
      editHabit,
      removeHabit,
      archiveHabit,
      toggleToday,
      toggleDate,
      getHabit: (id: string) => habits.find((h) => h.id === id),
    }),
    [habits, loading, reload, addHabit, editHabit, removeHabit, archiveHabit, toggleToday, toggleDate],
  );

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits(): HabitsContextValue {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be used within HabitsProvider');
  return ctx;
}
