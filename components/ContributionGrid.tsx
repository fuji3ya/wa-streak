/**
 * 貢献グリッド（GitHub contribution graph 風）。react-native-svg で <Rect> を敷く。
 * 列 = 週（日曜始まり）、行 = 曜日（日→土）。チェック済み = 季節色、未達 = 和紙の薄いマス。
 * Phase 2 でチェックイン時のバウンス + グローを当日マスに足す（演出A）。ここは静的描画。
 */
import { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';

import { addDays, todayStr } from '@/lib/date';
import { seasons, washi, type SeasonKey } from '@/lib/theme';

interface Props {
  checkInDates: string[];
  season: SeasonKey;
  /** 表示する週数（列数）。カード=8前後、詳細=17前後 */
  weeks?: number;
  /** マスの一辺(px) */
  cell?: number;
  /** マス間の余白(px) */
  gap?: number;
  today?: string;
}

export function ContributionGrid({
  checkInDates,
  season,
  weeks = 17,
  cell = 13,
  gap = 3,
  today = todayStr(),
}: Props) {
  const checked = useMemo(() => new Set(checkInDates), [checkInDates]);
  const palette = seasons[season];

  // 当日が属する週の日曜を起点に、weeks 週ぶん遡った最初の日曜を求める
  const [ty, tm, td] = today.split('-').map(Number);
  const todayDow = new Date(ty, tm - 1, td).getDay(); // 0=日..6=土
  const firstSunday = addDays(today, -(weeks - 1) * 7 - todayDow);

  const cells = useMemo(() => {
    const out: { x: number; y: number; fill: string; key: string }[] = [];
    for (let col = 0; col < weeks; col++) {
      for (let row = 0; row < 7; row++) {
        const date = addDays(firstSunday, col * 7 + row);
        let fill: string;
        if (date > today) fill = 'transparent'; // 未来マスは描かない
        else if (checked.has(date)) fill = palette.primary;
        else fill = washi.shadow;
        out.push({
          x: col * (cell + gap),
          y: row * (cell + gap),
          fill,
          key: date,
        });
      }
    }
    return out;
  }, [weeks, firstSunday, today, checked, palette.primary, cell, gap]);

  const width = weeks * (cell + gap) - gap;
  const height = 7 * (cell + gap) - gap;

  return (
    <Svg width={width} height={height}>
      {cells.map((c) =>
        c.fill === 'transparent' ? null : (
          <Rect
            key={c.key}
            x={c.x}
            y={c.y}
            width={cell}
            height={cell}
            rx={cell * 0.25}
            ry={cell * 0.25}
            fill={c.fill}
          />
        ),
      )}
    </Svg>
  );
}

export default ContributionGrid;
