/**
 * 和ストリーク — デザイントークン（土台）
 *
 * 余白・墨・季節色の基準値。design-reference-first ルールに従い、
 * これは「土台トークン」であって最終ビジュアルではない。
 * 実際の色味・グロー・余韻の最終チューニングは Phase 2 の HTML モック
 * （北極星と並べた anti-flat critique）で確定する。ここでは語彙を固定するだけ。
 *
 * 原則:
 *  - フラット単色で済ませない（濃淡・微グラデ・層影で奥行きを出す前提の語彙）
 *  - 呼吸する余白（spacing は詰めすぎない）
 *  - 季節色は彩度を抑えた和トーン（原色を避ける＝和の美意識＝差別化の核）
 */

/** 墨（すみ）— 濃淡のある黒。線・文字・消灯状態に使う */
export const sumi = {
  ink: '#1c1b1a', // 濃墨（最も濃い文字・主線）
  charcoal: '#3a3a40', // 消し炭（Lv0 消灯・無効状態）
  stone: '#56524b', // 石墨（副次テキスト）
  faint: '#8a857c', // 淡墨（補助テキスト・プレースホルダ）
} as const;

/** 和紙（わし）— 背景。ライトは生成り、ダークは墨夜 */
export const washi = {
  base: '#f4f1ea', // 和紙ベース（ライト背景）
  warm: '#efe9dd', // 生成り（カード面）
  shadow: '#e3dccd', // 和紙の影（境界・くぼみ）
  dark: '#16151a', // 墨夜（ダーク背景）
  darkRaised: '#201f25', // ダークのカード面
} as const;

export type SeasonKey = 'sakura' | 'ai' | 'momiji' | 'yukinezu';

/** 季節色 — 春=桜 / 夏=藍 / 秋=紅葉 / 冬=雪鼠。彩度を抑えた和トーン */
export const seasons: Record<
  SeasonKey,
  { key: SeasonKey; label: string; primary: string; deep: string; tint: string }
> = {
  sakura: { key: 'sakura', label: '桜', primary: '#e8a0b0', deep: '#c97a8e', tint: '#f6e2e7' },
  ai: { key: 'ai', label: '藍', primary: '#3f6f86', deep: '#2b4f63', tint: '#dbe6ea' },
  momiji: { key: 'momiji', label: '紅葉', primary: '#c0563a', deep: '#9a3f2a', tint: '#f0ddd4' },
  yukinezu: { key: 'yukinezu', label: '雪鼠', primary: '#9aa0a6', deep: '#6f757b', tint: '#e8eaec' },
};

/**
 * ストリークレベル → 和カラー（演出B「7段階エスカレーション」の土台）。
 * 原典 expectation-color-system の派手な原色を和トーンへ翻訳済み。
 * 「レベルが上がるほど 速く（pulseSec↓）・強く（glow↑）・濃く」の3軸法則だけ継承。
 * streakToLevel のしきい値・成長メタファのチューニングは Phase 2 で確定する。
 */
export const streakLevels = [
  { lv: 0, label: '種', growth: '種', color: sumi.charcoal, pulseSec: 0, glow: 0 },
  { lv: 1, label: '白磁', growth: '種が割れる', color: '#e8e4dc', pulseSec: 3.0, glow: 0.3 },
  { lv: 2, label: '若草', growth: '芽', color: '#8aa86b', pulseSec: 2.4, glow: 0.4 },
  { lv: 3, label: '浅葱', growth: '双葉', color: '#5b8a9a', pulseSec: 1.9, glow: 0.5 },
  { lv: 4, label: '藤紫', growth: '蕾', color: '#9a7fb0', pulseSec: 1.5, glow: 0.6 },
  { lv: 5, label: '山吹', growth: '開花', color: '#d4a13a', pulseSec: 1.0, glow: 0.8 },
  { lv: 6, label: '緋', growth: '大樹', color: '#c0473a', pulseSec: 0.65, glow: 1.0 },
  { lv: 7, label: '金', growth: '神木', color: '#caa84a', pulseSec: 0.4, glow: 1.0 },
] as const;

export type StreakLevel = (typeof streakLevels)[number]['lv'];

/** 余白スケール — 呼吸する余白。8の倍数を基調に詰めすぎない */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

/** 角丸 — 和の柔らかさ */
export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

/** タイポグラフィ — サイズ階層（フォント差し替えは後段） */
export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.5 },
  title: { fontSize: 24, fontWeight: '600' as const },
  heading: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

/** まとめ（必要に応じて分割 import 推奨） */
export const theme = {
  sumi,
  washi,
  seasons,
  streakLevels,
  spacing,
  radius,
  typography,
} as const;

export default theme;
