import { describe, expect, it } from 'vitest';

import { calcCurrentStreak, calcLongestStreak, streakToLevel, type Frequency } from '@/lib/streak';

const daily: Frequency = { type: 'daily' };

describe('calcCurrentStreak — daily', () => {
  it('空配列 → 0', () => {
    expect(calcCurrentStreak([], daily, '2026-06-05')).toBe(0);
  });
  it('今日チェック + 直前2日 → 3', () => {
    expect(calcCurrentStreak(['2026-06-03', '2026-06-04', '2026-06-05'], daily, '2026-06-05')).toBe(3);
  });
  it('今日未チェックでも昨日まで連続なら維持 → 2', () => {
    expect(calcCurrentStreak(['2026-06-03', '2026-06-04'], daily, '2026-06-05')).toBe(2);
  });
  it('途中の空白で途切れる → 2', () => {
    expect(calcCurrentStreak(['2026-06-01', '2026-06-04', '2026-06-05'], daily, '2026-06-05')).toBe(2);
  });
  it('今日も昨日も無し → 0', () => {
    expect(calcCurrentStreak(['2026-06-01', '2026-06-02'], daily, '2026-06-05')).toBe(0);
  });
  it('未来日付は無視 → 1', () => {
    expect(calcCurrentStreak(['2026-06-05', '2026-06-06', '2026-06-07'], daily, '2026-06-05')).toBe(1);
  });
  it('うるう年境界 2/28→2/29→3/1 が連続 → 3', () => {
    expect(calcCurrentStreak(['2024-02-28', '2024-02-29', '2024-03-01'], daily, '2024-03-01')).toBe(3);
  });
  it('年跨ぎ 12/31→1/1 が連続 → 2', () => {
    expect(calcCurrentStreak(['2025-12-31', '2026-01-01'], daily, '2026-01-01')).toBe(2);
  });
  it('重複日付は1日として吸収 → 2', () => {
    expect(calcCurrentStreak(['2026-06-04', '2026-06-04', '2026-06-05'], daily, '2026-06-05')).toBe(2);
  });
});

describe('calcCurrentStreak — weekdays (月水金 = 1,3,5)', () => {
  // 2026-06-01=月, 06-03=水, 06-05=金, 06-06=土, 06-08=月
  const wd: Frequency = { type: 'weekdays', value: '1,3,5' };
  it('予定日を連続達成 → 3', () => {
    expect(calcCurrentStreak(['2026-06-01', '2026-06-03', '2026-06-05'], wd, '2026-06-05')).toBe(3);
  });
  it('今日(金)が予定日で未達 → 猶予で 月水ぶん 2', () => {
    expect(calcCurrentStreak(['2026-06-01', '2026-06-03'], wd, '2026-06-05')).toBe(2);
  });
  it('今日(土)は予定外・直近予定日(金)達成済み → 2', () => {
    expect(calcCurrentStreak(['2026-06-03', '2026-06-05'], wd, '2026-06-06')).toBe(2);
  });
  it('過去の予定日(水)を落とした → 月達成でも 0', () => {
    expect(calcCurrentStreak(['2026-06-01'], wd, '2026-06-05')).toBe(0);
  });
});

describe('calcCurrentStreak — weekly_n (週3回・月曜始まり)', () => {
  const w3: Frequency = { type: 'weekly_n', value: '3' };
  // 今週 = 2026-06-01(月)..06-07(日)、前週 = 05-25..05-31
  it('今週3回達成 → 1', () => {
    expect(calcCurrentStreak(['2026-06-01', '2026-06-02', '2026-06-03'], w3, '2026-06-05')).toBe(1);
  });
  it('今週まだ2回(未達)でも前週達成 → 猶予で 1', () => {
    expect(
      calcCurrentStreak(
        ['2026-05-25', '2026-05-26', '2026-05-27', '2026-06-01', '2026-06-02'],
        w3,
        '2026-06-05',
      ),
    ).toBe(1);
  });
  it('今週・前週とも達成 → 2', () => {
    expect(
      calcCurrentStreak(
        ['2026-05-25', '2026-05-26', '2026-05-27', '2026-06-01', '2026-06-02', '2026-06-03'],
        w3,
        '2026-06-05',
      ),
    ).toBe(2);
  });
  it('今週未達・前週も未達 → 0', () => {
    expect(calcCurrentStreak(['2026-05-25', '2026-06-01', '2026-06-02'], w3, '2026-06-05')).toBe(0);
  });
});

describe('calcLongestStreak', () => {
  it('daily の最長連続 → 3', () => {
    expect(
      calcLongestStreak(
        ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-05', '2026-06-06'],
        daily,
      ),
    ).toBe(3);
  });
  it('weekdays の最長(予定日のみ評価) → 3', () => {
    const wd: Frequency = { type: 'weekdays', value: '1,3,5' };
    // 06-01月 06-03水 06-05金 連続3 → 06-08月 欠 → 06-10水 単発
    expect(calcLongestStreak(['2026-06-01', '2026-06-03', '2026-06-05', '2026-06-10'], wd)).toBe(3);
  });
  it('weekly_n の最長(連続達成週) → 2', () => {
    const w3: Frequency = { type: 'weekly_n', value: '3' };
    expect(
      calcLongestStreak(
        ['2026-05-25', '2026-05-26', '2026-05-27', '2026-06-01', '2026-06-02', '2026-06-03'],
        w3,
      ),
    ).toBe(2);
  });
  it('空配列 → 0', () => {
    expect(calcLongestStreak([], daily)).toBe(0);
  });
});

describe('streakToLevel', () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [6, 2],
    [7, 3],
    [13, 3],
    [14, 4],
    [29, 4],
    [30, 5],
    [99, 5],
    [100, 6],
    [364, 6],
    [365, 7],
    [1000, 7],
  ])('streak %i → level %i', (streak, level) => {
    expect(streakToLevel(streak)).toBe(level);
  });
});
