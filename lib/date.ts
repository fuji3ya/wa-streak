/**
 * ローカルカレンダー日のユーティリティ。streak.ts は 'YYYY-MM-DD' を
 * カレンダー日として扱うので、ここでは端末ローカルの暦日を文字列化する。
 */

/** ローカルの今日（または指定日）を 'YYYY-MM-DD' で返す */
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' の n 日前/後を返す（負で過去） */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return todayStr(dt);
}

/** 2つの 'YYYY-MM-DD' 間の日数差（a - b） */
export function diffDays(a: string, b: string): number {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  const ua = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const ub = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((ua - ub) / 86_400_000);
}
