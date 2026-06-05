/**
 * 和ストリーク — SQLite 永続化レイヤ（expo-sqlite SDK56 async API）。
 *
 * ストリーク数は保存しない（check_ins から派生算出。保存すると不整合の温床）。
 * 設定・テーマ・オンボ完了フラグは AsyncStorage（別レイヤ）に置く。
 */
import * as SQLite from 'expo-sqlite';

import { uid } from '@/lib/id';
import { todayStr } from '@/lib/date';
import type { CheckIn, Emblem, FrequencyType, Habit, HabitInput, SeasonKey } from '@/lib/types';

const DB_NAME = 'wa-streak.db';

let _dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      return db;
    })();
  }
  return _dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      emblem TEXT NOT NULL,
      theme_color TEXT NOT NULL,
      frequency_type TEXT NOT NULL,
      frequency_value TEXT,
      reminder_time TEXT,
      sort_order INTEGER NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS check_ins (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(habit_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_checkins_habit_date ON check_ins(habit_id, date);
  `);
}

// ── row → domain マッピング ────────────────────────────────────────────────

interface HabitRow {
  id: string;
  name: string;
  emblem: string;
  theme_color: string;
  frequency_type: string;
  frequency_value: string | null;
  reminder_time: string | null;
  sort_order: number;
  archived: number;
  created_at: string;
}

function rowToHabit(r: HabitRow): Habit {
  return {
    id: r.id,
    name: r.name,
    emblem: r.emblem as Emblem,
    themeColor: r.theme_color as SeasonKey,
    frequencyType: r.frequency_type as FrequencyType,
    frequencyValue: r.frequency_value,
    reminderTime: r.reminder_time,
    sortOrder: r.sort_order,
    archived: r.archived === 1,
    createdAt: r.created_at,
  };
}

// ── habits CRUD ──────────────────────────────────────────────────────────────

export async function listHabits(includeArchived = false): Promise<Habit[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<HabitRow>(
    `SELECT * FROM habits ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY sort_order ASC`,
  );
  return rows.map(rowToHabit);
}

export async function getHabit(id: string): Promise<Habit | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<HabitRow>(`SELECT * FROM habits WHERE id = ?`, id);
  return row ? rowToHabit(row) : null;
}

export async function createHabit(input: HabitInput): Promise<Habit> {
  const db = await getDb();
  const id = uid();
  const createdAt = new Date().toISOString();
  const next = await db.getFirstAsync<{ next: number }>(
    `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM habits`,
  );
  const sortOrder = next?.next ?? 0;
  await db.runAsync(
    `INSERT INTO habits
       (id, name, emblem, theme_color, frequency_type, frequency_value, reminder_time, sort_order, archived, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    id,
    input.name,
    input.emblem,
    input.themeColor,
    input.frequencyType,
    input.frequencyValue,
    input.reminderTime,
    sortOrder,
    createdAt,
  );
  return {
    id,
    sortOrder,
    archived: false,
    createdAt,
    ...input,
  };
}

export async function updateHabit(id: string, patch: HabitInput): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE habits
       SET name = ?, emblem = ?, theme_color = ?, frequency_type = ?, frequency_value = ?, reminder_time = ?
     WHERE id = ?`,
    patch.name,
    patch.emblem,
    patch.themeColor,
    patch.frequencyType,
    patch.frequencyValue,
    patch.reminderTime,
    id,
  );
}

export async function archiveHabit(id: string, archived = true): Promise<void> {
  const db = await getDb();
  await db.runAsync(`UPDATE habits SET archived = ? WHERE id = ?`, archived ? 1 : 0, id);
}

export async function deleteHabit(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM habits WHERE id = ?`, id); // check_ins は CASCADE で削除
}

// ── check-ins ────────────────────────────────────────────────────────────────

/** その習慣の全チェックイン日付（昇順） */
export async function listCheckInDates(habitId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT date FROM check_ins WHERE habit_id = ? ORDER BY date ASC`,
    habitId,
  );
  return rows.map((r) => r.date);
}

export async function isCheckedIn(habitId: string, date: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ one: number }>(
    `SELECT 1 AS one FROM check_ins WHERE habit_id = ? AND date = ?`,
    habitId,
    date,
  );
  return row != null;
}

/**
 * チェックインのトグル。既にあれば取消、なければ追加。
 * 返り値は「トグル後にチェック済みか」。date 省略時は今日。
 */
export async function toggleCheckIn(habitId: string, date: string = todayStr()): Promise<boolean> {
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM check_ins WHERE habit_id = ? AND date = ?`,
    habitId,
    date,
  );
  if (existing) {
    await db.runAsync(`DELETE FROM check_ins WHERE id = ?`, existing.id);
    return false;
  }
  await db.runAsync(
    `INSERT INTO check_ins (id, habit_id, date, created_at) VALUES (?, ?, ?, ?)`,
    uid(),
    habitId,
    date,
    new Date().toISOString(),
  );
  return true;
}

/** 全 CheckIn 行（デバッグ・エクスポート用） */
export async function listAllCheckIns(habitId: string): Promise<CheckIn[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    habit_id: string;
    date: string;
    created_at: string;
  }>(`SELECT * FROM check_ins WHERE habit_id = ? ORDER BY date ASC`, habitId);
  return rows.map((r) => ({
    id: r.id,
    habitId: r.habit_id,
    date: r.date,
    createdAt: r.created_at,
  }));
}
