// 비슷한 위스키 추천 — 순수 함수. PRD §5 설계를 따른다.
// sim(a,b) = Σ w · sim_g  (맛 벡터 코사인 + 태그 Jaccard + 캐스크 + 국가·종류 + 스펙)

import { AXES, AXIS_INDEX, currentWeights, type AxisKey, type SimilarityWeights } from '../config/flavor.ts';
import type { Whisky } from '../types.ts';

export type SimilarMode = 'similar' | 'cheaper' | 'upgrade' | 'shift';

export interface SimilarResult {
  whisky: Whisky;
  score: number; // 0~1
  common: string[]; // 공통점 (최대 3)
  diff?: string; // 가장 큰 차이 1개
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** 맛 벡터 거리 기반 유사도 (0~1). 코사인은 크기를 무시하므로 거리도 함께 본다. */
export function flavorSim(a: number[], b: number[]): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) d += (a[i] - (b[i] ?? 0)) ** 2;
  const maxDist = Math.sqrt(a.length * 25); // 모든 축이 0↔5 로 다를 때
  const dist = 1 - Math.sqrt(d) / maxDist;
  return 0.5 * cosine(a, b) + 0.5 * dist;
}

export function jaccard<T>(a: T[] = [], b: T[] = []): number {
  if (!a.length && !b.length) return 0;
  const sa = new Set(a);
  const inter = b.filter((x) => sa.has(x)).length;
  return inter / new Set([...a, ...b]).size;
}

function specSim(a: Whisky, b: Whisky): number {
  const parts: number[] = [];
  if (a.abv && b.abv) parts.push(1 - Math.min(Math.abs(a.abv - b.abv) / 20, 1));
  if (a.age != null && b.age != null) parts.push(1 - Math.min(Math.abs(a.age - b.age) / 15, 1));
  if (a.peated != null && b.peated != null) parts.push(a.peated === b.peated ? 1 : 0);
  return parts.length ? parts.reduce((s, x) => s + x, 0) / parts.length : 0.5;
}

export function similarity(a: Whisky, b: Whisky, w: SimilarityWeights = currentWeights()): number {
  if (!a.flavor || !b.flavor) return 0;
  const meta = (a.country === b.country ? 0.5 : 0) + (a.type === b.type ? 0.5 : 0);
  return (
    w.flavor * flavorSim(a.flavor, b.flavor) +
    w.tags * jaccard(a.tags, b.tags) +
    w.cask * jaccard(a.casks, b.casks) +
    w.meta * meta +
    w.spec * specSim(a, b)
  );
}

/** 공통점·차이점 설명 */
export function explain(base: Whisky, other: Whisky): { common: string[]; diff?: string } {
  const common: string[] = [];
  const casks = (base.casks ?? []).filter((c) => other.casks?.includes(c));
  if (casks.includes('sherry')) common.push('셰리 캐스크');
  else if (casks.includes('bourbon') && base.type !== 'bourbon') common.push('버번 캐스크');
  const tags = (base.tags ?? []).filter((t) => other.tags?.includes(t));
  if (tags.length) common.push(tags.map((t) => `#${t}`).join(' '));
  if (base.flavor && other.flavor) {
    // 둘 다 높은(≥3.5) 축 중 가장 비슷한 것
    const shared = AXES.map((ax, i) => ({ ax, i, lo: Math.min(base.flavor![i], other.flavor![i]) }))
      .filter((x) => x.lo >= 3.5)
      .sort((x, y) => y.lo - x.lo);
    if (shared[0]) common.push(`${shared[0].ax.label} 강함`);
  }
  if (common.length < 3 && base.region && base.region === other.region) common.push(base.region);

  let diff: string | undefined;
  if (base.flavor && other.flavor) {
    let best = { i: -1, d: 0 };
    base.flavor.forEach((v, i) => {
      const d = other.flavor![i] - v;
      if (Math.abs(d) > Math.abs(best.d)) best = { i, d };
    });
    if (best.i >= 0 && Math.abs(best.d) >= 1) diff = `${AXES[best.i].label} ${best.d > 0 ? '+' : ''}${best.d.toFixed(1)}`;
  }
  if (base.price && other.price && other.price < base.price * 0.9) {
    const pct = Math.round((1 - other.price / base.price) * 100);
    diff = diff ? `${diff}, 약 ${pct}% 저렴` : `약 ${pct}% 저렴`;
  }
  return { common: common.slice(0, 3), diff };
}

/** 같은 브랜드 결과를 최대 n개로 제한 */
function diversify(list: SimilarResult[], maxPerBrand: number, limit: number): SimilarResult[] {
  const count = new Map<string, number>();
  const out: SimilarResult[] = [];
  for (const r of list) {
    const key = r.whisky.brand ?? r.whisky.id;
    const c = count.get(key) ?? 0;
    if (c >= maxPerBrand) continue;
    count.set(key, c + 1);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}

export interface FindOptions {
  mode?: SimilarMode;
  limit?: number;
  /** shift 모드: 바꿀 축과 변화량(-3~+3) */
  shift?: { axis: AxisKey; delta: number };
  exclude?: Set<string>;
  weights?: SimilarityWeights;
}

export function findSimilar(base: Whisky, all: Whisky[], opts: FindOptions = {}): SimilarResult[] {
  const { mode = 'similar', limit = 6, exclude, weights = currentWeights() } = opts;
  if (!base.flavor) return [];

  let target: Whisky = base;
  if (mode === 'shift' && opts.shift) {
    const v = [...base.flavor];
    const i = AXIS_INDEX[opts.shift.axis];
    v[i] = Math.max(0, Math.min(5, v[i] + opts.shift.delta));
    target = { ...base, flavor: v, tags: [] }; // 태그는 기준 맛을 끌어당기므로 제외
  }

  let pool = all.filter((w) => w.id !== base.id && w.flavor && !exclude?.has(w.id));
  if (mode === 'cheaper') pool = pool.filter((w) => base.price && w.price && w.price <= base.price * weights.cheaperRatio);
  if (mode === 'upgrade')
    pool = pool.filter(
      (w) => base.price && w.price && w.price > base.price * 1.2 && w.price <= base.price * 4 && (w.age ?? 0) >= (base.age ?? 0),
    );
  if (mode === 'shift' && opts.shift) {
    // 선택한 축이 실제로 그 방향으로 움직인 것만
    const i = AXIS_INDEX[opts.shift.axis];
    const dir = Math.sign(opts.shift.delta);
    pool = pool.filter((w) => dir === 0 || Math.sign(w.flavor![i] - base.flavor![i]) === dir);
  }

  const scored = pool
    .map((w) => ({ whisky: w, score: similarity(target, w, weights), ...explain(base, w) }))
    .sort((a, b) => b.score - a.score);
  return diversify(scored, weights.maxPerBrand, limit);
}

/** 취향 벡터(사용자)와 위스키의 적합도 0~1 */
export function tasteFit(taste: number[], w: Whisky): number {
  return w.flavor ? flavorSim(taste, w.flavor) : 0;
}
