// P1 기능의 계산 부분 (화면과 분리한 순수 함수):
//  - 증류소 페이지(F-108): 도감을 증류소별로 묶고 대표 맛 경향을 뽑는다
//  - 체감 가성비 랭킹(F-603): 내 별점 ÷ 참고 가격
//  - 테이스팅 노트 도우미(F-208): 자유 문장 → 표준 아로마 태그
import { AXES, type AxisKey } from '../config/flavor.ts';
import type { Whisky } from '../types.ts';
import type { Tasting } from './collection.ts';
import { tasteFit } from './similar.ts';

/* ── 증류소 ── */

export interface DistilleryGroup {
  name: string;
  slug: string;
  country: string;
  region?: string;
  lat?: number;
  lng?: number;
  whiskies: Whisky[];
  tried: number;
  /** 라인업 평균 맛 10축 (맛 정보 있는 것만) */
  flavor: number[] | null;
  /** 평균이 높은 축 3개 (대표 맛 경향) */
  top: string[];
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '');

export function averageFlavor(ws: Whisky[]): number[] | null {
  const fs = ws.map((w) => w.flavor).filter((f): f is NonNullable<Whisky['flavor']> => !!f);
  if (!fs.length) return null;
  return AXES.map((_, i) => Math.round((fs.reduce((s, f) => s + f[i], 0) / fs.length) * 10) / 10);
}

export function topAxes(f: number[] | null, n = 3): string[] {
  if (!f) return [];
  return AXES.map((a, i) => ({ label: a.label, v: f[i] }))
    .filter((x) => x.v >= 2)
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((x) => x.label);
}

/** 도감을 증류소별로 묶는다. 블렌디드처럼 증류소가 없는 위스키는 빠진다. 라인업이 많은 순. */
export function groupByDistillery(dex: Whisky[], tried: Set<string>): DistilleryGroup[] {
  const map = new Map<string, Whisky[]>();
  for (const w of dex) {
    if (!w.distillery) continue;
    const key = slugify(w.distillery);
    if (!key) continue;
    map.set(key, [...(map.get(key) ?? []), w]);
  }
  return [...map.entries()]
    .map(([slug, ws]) => {
      const first = ws.find((w) => w.lat != null) ?? ws[0];
      const flavor = averageFlavor(ws);
      return {
        name: ws[0].distillery!.replace(/^The\s+/, ''),
        slug,
        country: ws[0].country ?? '',
        region: ws.find((w) => w.region)?.region,
        lat: first.lat,
        lng: first.lng,
        whiskies: [...ws].sort((a, b) => (a.age ?? 0) - (b.age ?? 0) || a.name.localeCompare(b.name)),
        tried: ws.filter((w) => tried.has(w.id)).length,
        flavor,
        top: topAxes(flavor),
      };
    })
    .sort((a, b) => b.whiskies.length - a.whiskies.length || a.name.localeCompare(b.name));
}

/* ── 체감 가성비 ── */

export interface ValueRow {
  w: Whisky;
  rating: number; // 내 평균 별점
  count: number; // 기록 수
  /** 10만 원당 별점 = 평균 별점 ÷ (참고 가격 / 10만 원) */
  index: number;
}

/** 내 시음 기록으로 만든 가성비 순위. 참고 가격이 없는 위스키는 뺀다. */
export function valueRanking(tastings: Tasting[], byId: Map<string, Whisky>, limit = 10): ValueRow[] {
  const by = new Map<string, number[]>();
  for (const t of tastings) by.set(t.whiskyId, [...(by.get(t.whiskyId) ?? []), t.rating]);
  const rows: ValueRow[] = [];
  for (const [id, rs] of by) {
    const w = byId.get(id);
    if (!w?.price || w.price <= 0) continue;
    const rating = rs.reduce((s, r) => s + r, 0) / rs.length;
    rows.push({ w, rating: Math.round(rating * 10) / 10, count: rs.length, index: Math.round((rating / (w.price / 10)) * 100) / 100 });
  }
  return rows.sort((a, b) => b.index - a.index || b.rating - a.rating).slice(0, limit);
}

/* ── 테이스팅 노트 도우미 ── */

/** 표준 아로마 태그 ← 사람들이 실제로 쓰는 말 (한국어·영어, 앞부분만 맞아도 잡는다) */
export const AROMA_LEXICON: Record<string, string[]> = {
  스모크: ['스모크', '스모키', '연기', '훈연', '그을', 'smok'],
  모닥불: ['모닥불', '캠프파이어', '장작', 'bonfire', 'campfire'],
  요오드: ['요오드', '소독', '병원', '반창고', 'iodine', 'medic'],
  바다소금: ['바다', '짠', '짭짤', '소금', '해풍', 'salt', 'brine', 'sea'],
  건포도: ['건포도', 'raisin'],
  건과일: ['건과일', '말린 과일', '대추', '자두', 'dried fruit', 'prune'],
  다크초콜릿: ['다크초콜릿', '초콜릿', '코코아', 'chocolate', 'cocoa'],
  바닐라: ['바닐라', 'vanilla'],
  꿀: ['꿀', '허니', 'honey'],
  캐러멜: ['캐러멜', '카라멜', '토피', '버터스카치', 'caramel', 'toffee'],
  오렌지: ['오렌지', '귤', '감귤', '시트러스', 'orange', 'citrus'],
  레몬: ['레몬', 'lemon'],
  사과: ['사과', '애플', 'apple'],
  배: ['배향', '서양배', 'pear'],
  열대과일: ['열대', '파인애플', '망고', '바나나', 'tropical', 'pineapple', 'mango'],
  체리: ['체리', 'cherry'],
  꽃: ['꽃', '플로럴', '장미', 'floral', 'flower'],
  풀: ['풀', '허브', '잔디', 'grass', 'herb'],
  시나몬: ['시나몬', '계피', 'cinnamon'],
  후추: ['후추', '페퍼', '매콤', '스파이시', 'pepper', 'spicy'],
  생강: ['생강', 'ginger'],
  오크: ['오크', '나무', '우디', 'oak', 'wood'],
  견과: ['견과', '아몬드', '호두', '헤이즐넛', '땅콩', 'nut', 'almond'],
  몰트: ['몰트', '보리', '곡물', '빵', '비스킷', 'malt', 'cereal', 'biscuit'],
  가죽: ['가죽', '담배', 'leather', 'tobacco'],
  커피: ['커피', '에스프레소', 'coffee'],
  셰리: ['셰리', '쉐리', 'sherry'],
};

/** 축 → 그 축을 대표하는 태그 (자유 문장에 없을 때 제안용) */
const AXIS_TAGS: Record<AxisKey, string[]> = {
  sweet: ['꿀', '바닐라', '캐러멜'],
  smoky: ['스모크', '모닥불', '요오드'],
  body: ['가죽', '다크초콜릿'],
  spicy: ['후추', '시나몬', '생강'],
  fruity: ['사과', '열대과일', '오렌지'],
  floral: ['꽃', '풀'],
  malty: ['몰트'],
  oaky: ['오크'],
  nutty: ['견과'],
  winey: ['건포도', '셰리', '건과일'],
};

export function noteSuggestions(text: string, w?: Whisky, max = 6): { matched: string[]; suggested: string[] } {
  const t = text.toLowerCase();
  const matched = Object.entries(AROMA_LEXICON)
    .filter(([, words]) => words.some((x) => t.includes(x.toLowerCase())))
    .map(([tag]) => tag);
  const pool: string[] = [...(w?.tags ?? [])];
  if (w?.flavor) {
    AXES.map((a, i) => ({ key: a.key, v: w.flavor![i] }))
      .filter((x) => x.v >= 3)
      .sort((a, b) => b.v - a.v)
      .forEach((x) => pool.push(...AXIS_TAGS[x.key]));
  }
  const suggested = [...new Set(pool)].filter((x) => !matched.includes(x) && !t.includes(x.toLowerCase())).slice(0, max);
  return { matched, suggested };
}

/** 메모 끝에 태그를 덧붙인다 (이미 있으면 그대로) */
export function appendTag(note: string, tag: string): string {
  if (note.includes(tag)) return note;
  const base = note.trimEnd();
  return base ? `${base}${/[,.]$/.test(base) ? ' ' : ', '}${tag}` : tag;
}

/* ── 첫 화면: 내 바 선반 · 최근 잔 · 다음 잔 ── */

export interface ShelfItem {
  w: Whisky;
  date: string; // 가장 최근 시음일
  rating: number; // 그날 별점
  count: number; // 이 위스키 기록 수
}

/** 최근에 마신 순서로 위스키를 한 번씩만 (선반·리본용) */
export function recentShelf(tastings: Tasting[], byId: Map<string, Whisky>, n = 8): ShelfItem[] {
  const sorted = [...tastings].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const seen = new Map<string, ShelfItem>();
  for (const t of sorted) {
    const w = byId.get(t.whiskyId);
    if (!w) continue;
    const s = seen.get(w.id);
    if (s) s.count++;
    else seen.set(w.id, { w, date: t.date, rating: t.rating, count: 1 });
  }
  return [...seen.values()].slice(0, n);
}

/** 다음 잔: 아직 안 마신 위스키 가운데 내 취향에 가장 가까운 한 병. 취향이 없으면 입문용 기본값 */
export function nextPick(taste: number[] | null, dex: Whisky[], tried: Set<string>, fallbackId = 'seed-glenfiddich-12'): { w: Whisky; reason: string } | null {
  if (!taste) {
    const w = dex.find((x) => x.id === fallbackId && !tried.has(x.id)) ?? dex.find((x) => !tried.has(x.id) && x.flavor);
    return w ? { w, reason: '처음 한 병으로 많이 고르는 위스키' } : null;
  }
  // 예산: 마신 병들의 참고 가격 중앙값의 1.5배(최소 15만 원). 이보다 비싼 병은 후보에서 뺀다
  const paid = dex.filter((w) => tried.has(w.id) && w.price).map((w) => w.price!).sort((x, y) => x - y);
  const budget = paid.length ? Math.max(15, paid[Math.floor(paid.length / 2)] * 1.5) : Infinity;
  let best: Whisky | null = null;
  let bestScore = -1;
  for (const w of dex) {
    if (tried.has(w.id) || !w.flavor || (w.price ?? 0) > budget) continue;
    const s = tasteFit(taste, w) + (w.price ? 0.01 : 0); // 같은 점수면 참고 가격이 있는 병을 앞에
    if (s > bestScore) [best, bestScore] = [w, s];
  }
  if (!best) return null;
  const top = topAxes(taste, 2);
  return { w: best, reason: top.length ? `지금까지 마신 잔의 ${top.join(', ')} 쪽과 가장 가까움` : '지금까지의 기록과 가장 가까움' };
}
