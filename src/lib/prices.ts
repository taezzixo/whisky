// 용량·판매처별 참고 가격 정리 (추정치, 판매 정보 아님).
// 700ml 국내가는 Whisky.price, 그 밖의 용량·면세가는 Whisky.prices.
import type { PriceOffer, Whisky } from '../types.ts';

const won = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 });
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export const sizeLabel = (ml: number) => (ml >= 1000 ? `${won.format(ml / 1000)}L` : `${ml}ml`);

export interface OfferLine {
  where: 'kr' | 'dutyfree';
  ml: number;
  text: string; // 예: "약 9.5만 원", "약 $45"
}

/** 국내가(작은 용량부터) → 면세가 순서로 정리 */
export function offerLines(w: Pick<Whisky, 'price' | 'prices'>): OfferLine[] {
  const all: PriceOffer[] = [...(w.price ? [{ ml: 700, won: w.price, where: 'kr' as const }] : []), ...(w.prices ?? [])];
  const seen = new Set<string>();
  return all
    .map((p) => ({ where: p.where ?? (p.usd != null ? 'dutyfree' : 'kr'), ml: p.ml, won: p.won, usd: p.usd }))
    .filter((p) => (p.where === 'kr' ? p.won != null : p.usd != null))
    .filter((p) => {
      const k = `${p.where}-${p.ml}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => (a.where === b.where ? a.ml - b.ml : a.where === 'kr' ? -1 : 1))
    .map((p) => ({ where: p.where, ml: p.ml, text: p.where === 'kr' ? `약 ${won.format(p.won!)}만 원` : `약 ${usd.format(p.usd!)}` }));
}

/** 목록에 쓰는 한 줄 가격: 700ml 국내가 → 다른 용량 국내가 → 면세가 */
export function shortPrice(w: Pick<Whisky, 'price' | 'prices'>): string {
  const lines = offerLines(w);
  const kr = lines.find((l) => l.where === 'kr');
  if (kr) return kr.ml === 700 ? kr.text : `${kr.text}(${sizeLabel(kr.ml)})`;
  const df = lines.find((l) => l.where === 'dutyfree');
  return df ? `면세 ${df.text}(${sizeLabel(df.ml)})` : '';
}

export const hasDutyFree = (w: Pick<Whisky, 'dutyFree' | 'prices'>) => !!w.dutyFree || !!w.prices?.some((p) => p.where === 'dutyfree');
