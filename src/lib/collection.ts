// 도감 수집 — 수집률, 배지, 시음 기록 기반 취향 벡터. 모두 순수 함수.

import type { Whisky } from '../types.ts';

export interface Tasting {
  id: string;
  whiskyId: string;
  rating: number; // 0.5~5, 0.5 단위
  date: string; // YYYY-MM-DD
  serve?: 'neat' | 'rocks' | 'highball' | 'water';
  note?: string;
}

export const SERVE_LABEL = { neat: '니트', rocks: '온더락', highball: '하이볼', water: '물 몇 방울' } as const;

export interface Badge {
  id: string;
  name: string;
  rule: string; // 획득 조건 설명
  target: number;
  count: (tried: Whisky[]) => number;
}

const n = (tried: Whisky[], f: (w: Whisky) => boolean) => tried.filter(f).length;

export const BADGES: Badge[] = [
  { id: 'first', name: '첫 잔', rule: '위스키 1종 기록', target: 1, count: (t) => t.length },
  { id: 'ten', name: '열 잔 클럽', rule: '위스키 10종 기록', target: 10, count: (t) => t.length },
  { id: 'islay', name: '아일라 순례자', rule: '아일라 위스키 5종', target: 5, count: (t) => n(t, (w) => w.region === '아일라') },
  { id: 'sherry', name: '셰리 애호가', rule: '셰리 캐스크 위스키 5종', target: 5, count: (t) => n(t, (w) => !!w.casks?.includes('sherry')) },
  { id: 'bourbon', name: '버번 트레일', rule: '버번·테네시 5종', target: 5, count: (t) => n(t, (w) => w.type === 'bourbon' || w.type === 'tennessee') },
  { id: 'rye', name: '호밀밭', rule: '라이 위스키 3종', target: 3, count: (t) => n(t, (w) => w.type === 'rye') },
  { id: 'peat', name: '연기 속으로', rule: '피트 위스키 1종', target: 1, count: (t) => n(t, (w) => !!w.peated) },
  { id: 'world', name: '세계 일주', rule: '5개 나라의 위스키', target: 5, count: (t) => new Set(t.map((w) => w.country).filter(Boolean)).size },
  { id: 'japan', name: '일본 위스키 탐방', rule: '일본 위스키 3종', target: 3, count: (t) => n(t, (w) => w.country === '일본') },
  { id: 'aged', name: '세월의 맛', rule: '18년 이상 숙성 3종', target: 3, count: (t) => n(t, (w) => (w.age ?? 0) >= 18) },
  { id: 'cask-strength', name: '캐스크 스트렝스', rule: '도수 55% 이상 2종', target: 2, count: (t) => n(t, (w) => (w.abv ?? 0) >= 55) },
  { id: 'regions', name: '스코틀랜드 지도', rule: '스코틀랜드 4개 지역', target: 4, count: (t) => new Set(t.filter((w) => w.country === '스코틀랜드' && w.region).map((w) => w.region!.replace(/\(.*\)/, ''))).size },
];

export interface BadgeState {
  badge: Badge;
  count: number;
  earned: boolean;
}

export function badgeStates(tried: Whisky[]): BadgeState[] {
  return BADGES.map((b) => {
    const count = b.count(tried);
    return { badge: b, count: Math.min(count, b.target), earned: count >= b.target };
  });
}

/** 마신 위스키 id 집합: 시음 기록 + "마셔봤어요" 표시 */
export function triedIds(tried: string[], tastings: Tasting[]): Set<string> {
  return new Set([...tried, ...tastings.map((t) => t.whiskyId)]);
}

export function collectionRate(dex: Whisky[], tried: Set<string>): { done: number; total: number; pct: number } {
  const done = dex.filter((w) => tried.has(w.id)).length;
  return { done, total: dex.length, pct: dex.length ? (done / dex.length) * 100 : 0 };
}

/** 나라별 수집 현황 (위스키 많은 나라 순) */
export function byCountry(dex: Whisky[], tried: Set<string>) {
  const m = new Map<string, { total: number; done: number }>();
  for (const w of dex) {
    const r = m.get(w.country) ?? { total: 0, done: 0 };
    r.total++;
    if (tried.has(w.id)) r.done++;
    m.set(w.country, r);
  }
  return [...m.entries()].map(([country, r]) => ({ country, ...r })).sort((a, b) => b.total - a.total);
}

/**
 * 시음 기록으로 만든 내 취향 벡터.
 * 별점이 높을수록 가중치가 크고(2.5점 이하는 거의 반영 안 함), 같은 위스키는 가장 최근 기록만 쓴다.
 */
export function tasteFromTastings(tastings: Tasting[], byId: Map<string, Whisky>): number[] | null {
  const latest = new Map<string, Tasting>();
  for (const t of [...tastings].sort((a, b) => a.date.localeCompare(b.date))) latest.set(t.whiskyId, t);
  const sum = new Array(10).fill(0);
  let wsum = 0;
  for (const t of latest.values()) {
    const f = byId.get(t.whiskyId)?.flavor;
    if (!f) continue;
    const w = Math.max(0.1, t.rating - 2.5) ** 1.5;
    f.forEach((v, i) => (sum[i] += v * w));
    wsum += w;
  }
  return wsum ? sum.map((v) => Math.round((v / wsum) * 10) / 10) : null;
}

/** 맛 지도 좌표: x = 바디(가벼움→묵직함), y = 스모키 − (과일+단맛)/2 (부드러움·과일 → 스모키) */
export function mapPoint(f: number[]): { x: number; y: number } {
  return { x: f[2], y: f[1] - (f[4] + f[0]) / 2 };
}

// ── 나만의 가상 바 (보유 바틀) ──────────────────────────────
export type BottleState = 'sealed' | 'open' | 'empty';
export const BOTTLE_STATE_LABEL: Record<BottleState, string> = { sealed: '미개봉', open: '마시는 중', empty: '빈 병' };

export interface CabinetItem {
  id: string;
  whiskyId: string;
  state: BottleState;
  fill: number; // 남은 양 0~100(%)
  openedAt?: string; // YYYY-MM-DD
}

/**
 * 개봉한 병의 산화 안내. 병 속 공기가 많을수록(남은 양이 적을수록), 오래 열어 둘수록 향이 빨리 빠진다.
 * 일반적인 경험칙: 절반 이하로 남은 병은 몇 달, 거의 가득한 병은 1~2년.
 */
export function oxidationAdvice(item: CabinetItem, today: string): { level: 'ok' | 'soon' | 'now'; text: string } | null {
  if (item.state !== 'open' || !item.openedAt) return null;
  const months = (Date.parse(today) - Date.parse(item.openedAt)) / (30.4 * 864e5);
  const limit = item.fill <= 30 ? 3 : item.fill <= 60 ? 9 : 18; // 남은 양별 권장 기간(개월)
  if (months >= limit) return { level: 'now', text: `연 지 ${Math.floor(months)}개월, 남은 양 ${item.fill}%. 향이 빠지기 전에 드세요.` };
  if (months >= limit * 0.7) return { level: 'soon', text: `연 지 ${Math.floor(months)}개월. ${Math.ceil(limit - months)}개월 안에 드시는 걸 권합니다.` };
  return { level: 'ok', text: `연 지 ${Math.max(0, Math.floor(months))}개월. 아직 괜찮습니다.` };
}

/** 바코드(8~14자리 숫자)로 위스키 찾기 */
export function findByBarcode(items: Whisky[], code: string): Whisky | undefined {
  const c = code.replace(/\D/g, '');
  if (c.length < 8 || c.length > 14) return undefined;
  const strip = (x: string) => x.replace(/^0+/, '');
  return items.find((w) => w.barcode?.some((b) => strip(b) === strip(c)));
}
