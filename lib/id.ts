/**
 * ローカル PK 用の短い一意 ID。端末内のみで衝突回避できれば十分なので
 * 時刻 + ランダムで生成する（外部公開・分散整合は不要）。
 */
export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
