/**
 * 和ストリーク — ストリーク計算（純粋関数・UI 非依存・テスト対象）
 *
 * 設計方針:
 *  - 日付は 'YYYY-MM-DD'（ローカルタイムゾーンのカレンダー日）として扱う。
 *    内部では UTC 正午基準の「エポックからの日数(dayNum)」に変換して計算し、
 *    端末の TZ やサマータイムに依存しない（TZ 跨ぎ・うるう年・年跨ぎ安全）。
 *  - check_ins は (habit_id, date) UNIQUE なので 1 日 1 件前提（重複は Set で吸収）。
 *  - 未来日付（today より後）は無視する。
 *  - current streak には「今日まだ未達でも、昨日まで連続なら維持」の猶予を入れる
 *    （daily=昨日 / weekdays=今日が予定日なら猶予 / weekly_n=今週がまだ途中なら猶予）。
 */

export type FrequencyType = 'daily' | 'weekdays' | 'weekly_n';

export interface Frequency {
  type: FrequencyType;
  /** weekdays: '1,3,5'（0=日..6=土）/ weekly_n: '3'（週あたり回数）/ daily: 不要 */
  value?: string | null;
}

/** ストリークレベル 0..7（lib/theme.ts の streakLevels と対応） */
export type Level = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const MS_PER_DAY = 86_400_000;

/** 'YYYY-MM-DD' → エポックからの日数（カレンダー日基準・TZ 非依存） */
function toDayNum(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

/** dayNum → 曜日（0=日..6=土） */
function dowOf(n: number): number {
  return new Date(n * MS_PER_DAY).getUTCDay();
}

/** その日が属する週の開始 dayNum（既定は月曜始まり weekStartsOn=1） */
function weekStartDayNum(n: number, weekStartsOn = 1): number {
  const wd = dowOf(n);
  const diff = (wd - weekStartsOn + 7) % 7;
  return n - diff;
}

function scheduledDowSet(freq: Frequency): Set<number> {
  if (freq.type === 'weekdays' && freq.value) {
    return new Set(
      freq.value
        .split(',')
        .map((s) => parseInt(s, 10))
        .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6),
    );
  }
  return new Set();
}

/** d より前の直近の予定日（weekdays 用） */
function prevScheduled(d: number, sched: Set<number>): number {
  let x = d - 1;
  let guard = 0;
  while (!sched.has(dowOf(x))) {
    x--;
    if (++guard > 14) break;
  }
  return x;
}

// ── current streak ──────────────────────────────────────────────────────────

export function calcCurrentStreak(
  checkInDates: string[],
  frequency: Frequency,
  today: string,
): number {
  const t = toDayNum(today);
  const set = new Set(checkInDates.map(toDayNum).filter((n) => n <= t)); // 未来は無視
  if (set.size === 0) return 0;

  switch (frequency.type) {
    case 'weekly_n':
      return currentWeeklyN(set, frequency, t);
    case 'weekdays':
      return currentWeekdays(set, frequency, t);
    case 'daily':
    default:
      return currentDaily(set, t);
  }
}

function currentDaily(set: Set<number>, t: number): number {
  let cur: number;
  if (set.has(t)) cur = t;
  else if (set.has(t - 1)) cur = t - 1; // 今日未達でも昨日まで連続なら維持
  else return 0;

  let c = 0;
  while (set.has(cur)) {
    c++;
    cur--;
  }
  return c;
}

function currentWeekdays(set: Set<number>, freq: Frequency, t: number): number {
  const sched = scheduledDowSet(freq);
  if (sched.size === 0) return currentDaily(set, t);

  // today 以前の直近の予定日を探す
  let d = t;
  let guard = 0;
  while (!sched.has(dowOf(d))) {
    d--;
    if (++guard > 14) return 0;
  }

  if (!set.has(d)) {
    if (d === t) {
      // 今日が予定日でまだ未達 → 猶予。前の予定日から数える
      d = prevScheduled(d, sched);
    } else {
      return 0; // 直近の予定日（過去）を落とした = 途切れ
    }
  }

  let c = 0;
  while (set.has(d)) {
    c++;
    d = prevScheduled(d, sched);
  }
  return c;
}

function currentWeeklyN(set: Set<number>, freq: Frequency, t: number): number {
  const n = Math.max(1, parseInt(freq.value ?? '1', 10) || 1);
  const countInWeek = (ws: number): number => {
    let c = 0;
    for (const day of set) {
      if (day >= ws && day <= ws + 6 && day <= t) c++;
    }
    return c;
  };

  let ws = weekStartDayNum(t);
  let c = 0;

  // 今週: 達成済みなら数える。未達でも週がまだ途中なので途切れさせない（猶予）
  if (countInWeek(ws) >= n) c++;
  ws -= 7;

  // 過去週: N 未満が出たら停止
  while (countInWeek(ws) >= n) {
    c++;
    ws -= 7;
  }
  return c;
}

// ── longest streak（履歴最長・猶予なし） ────────────────────────────────────

export function calcLongestStreak(checkInDates: string[], frequency: Frequency): number {
  const nums = [...new Set(checkInDates.map(toDayNum))].sort((a, b) => a - b);
  if (nums.length === 0) return 0;
  const set = new Set(nums);

  switch (frequency.type) {
    case 'weekly_n':
      return longestWeeklyN(set, nums, frequency);
    case 'weekdays':
      return longestWeekdays(set, nums, frequency);
    case 'daily':
    default:
      return longestDaily(nums);
  }
}

function longestDaily(nums: number[]): number {
  let best = 1;
  let cur = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === nums[i - 1] + 1) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }
  return best;
}

function longestWeekdays(set: Set<number>, nums: number[], freq: Frequency): number {
  const sched = scheduledDowSet(freq);
  if (sched.size === 0) return longestDaily(nums);
  const min = nums[0];
  const max = nums[nums.length - 1];
  let best = 0;
  let cur = 0;
  for (let d = min; d <= max; d++) {
    if (!sched.has(dowOf(d))) continue; // 予定日のみ評価
    if (set.has(d)) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

function longestWeeklyN(set: Set<number>, nums: number[], freq: Frequency): number {
  const n = Math.max(1, parseInt(freq.value ?? '1', 10) || 1);
  const min = nums[0];
  const max = nums[nums.length - 1];
  const ws0 = weekStartDayNum(min);
  const wsN = weekStartDayNum(max);
  const countInWeek = (ws: number): number => {
    let c = 0;
    for (const day of set) {
      if (day >= ws && day <= ws + 6) c++;
    }
    return c;
  };
  let best = 0;
  let cur = 0;
  for (let ws = ws0; ws <= wsN; ws += 7) {
    if (countInWeek(ws) >= n) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

// ── level mapping ───────────────────────────────────────────────────────────

/** ストリーク日数 → レベル 0..7（lib/theme.ts streakLevels のしきい値） */
export function streakToLevel(streak: number): Level {
  if (streak <= 0) return 0;
  if (streak <= 2) return 1;
  if (streak <= 6) return 2;
  if (streak <= 13) return 3;
  if (streak <= 29) return 4;
  if (streak <= 99) return 5;
  if (streak <= 364) return 6;
  return 7;
}
