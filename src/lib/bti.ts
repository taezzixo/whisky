// 위스키BTI 계산 — 순수 함수. 답변 → 취향 벡터 → 유형 코드 → 추천.

import { AXES, AXIS_INDEX } from '../config/flavor.ts';
import { BASE_TASTE, BTI_VERSION, QUESTIONS, TYPE_PREFIX, TYPE_SUFFIX, type Choice } from '../config/bti.ts';
import type { Whisky } from '../types.ts';
import { tasteFit } from './similar.ts';

/** 문항 id → 고른 보기 번호 */
export type Answers = Record<string, number>;

export interface BtiProfile {
  version: string;
  taste: number[]; // 10축
  budget: number; // 만원
  highball: boolean;
  adventure: number; // -1~+1
  code: string; // 예: PR-SX
  name: string;
  emoji: string;
  desc: string;
}

const clamp = (v: number, lo = 0, hi = 5) => Math.max(lo, Math.min(hi, v));

export function chosen(answers: Answers): Choice[] {
  return QUESTIONS.flatMap((q) => (answers[q.id] != null && q.choices[answers[q.id]] ? [q.choices[answers[q.id]]] : []));
}

export function buildProfile(answers: Answers): BtiProfile {
  const taste = AXES.map((a) => BASE_TASTE[a.key]);
  let budget = 999;
  let highball = false;
  let adventure = 0;
  for (const c of chosen(answers)) {
    for (const [k, v] of Object.entries(c.effect ?? {})) taste[AXIS_INDEX[k as keyof typeof AXIS_INDEX]] += v ?? 0;
    if (c.budget != null) budget = c.budget;
    if (c.highball) highball = true;
    adventure += c.adventure ?? 0;
  }
  const t = taste.map((v) => Math.round(clamp(v) * 10) / 10);
  const code = typeCode(t);
  const [p, s] = code.split('-');
  return {
    version: BTI_VERSION,
    taste: t,
    budget,
    highball,
    adventure: clamp(adventure / 2, -1, 1),
    code,
    name: `${TYPE_PREFIX[p]} ${TYPE_SUFFIX[s].name}`,
    emoji: TYPE_SUFFIX[s].emoji,
    desc: TYPE_SUFFIX[s].desc,
  };
}

export function typeCode(t: number[]): string {
  const g = (k: keyof typeof AXIS_INDEX) => t[AXIS_INDEX[k]];
  const peat = g('smoky') >= 2.5 ? 'P' : 'C';
  const rich = g('body') >= 3 ? 'R' : 'L';
  const sherry = g('winey') + g('nutty') >= g('oaky') + g('sweet') - 0.5 ? 'S' : 'B';
  const spice = g('spicy') >= 2.5 ? 'X' : 'M';
  return `${peat}${rich}-${sherry}${spice}`;
}

export interface BtiPick {
  whisky: Whisky;
  fit: number; // 0~1
  reason: string;
}

function score(p: BtiProfile, w: Whisky): number {
  let s = tasteFit(p.taste, w);
  if (p.highball) s += w.highball ? 0.06 : -0.03;
  const extreme = (w.flavor ?? []).some((v) => v >= 4.5) || (w.abv ?? 0) >= 50;
  if (p.adventure < 0 && extreme) s -= 0.05 * -p.adventure;
  if (p.adventure > 0 && extreme) s += 0.03 * p.adventure;
  return s;
}

function reason(p: BtiProfile, w: Whisky): string {
  if (!w.flavor) return '';
  // 취향과 위스키 모두 높은 축
  const top = AXES.map((a, i) => ({ label: a.label, v: Math.min(p.taste[i], w.flavor![i]) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 2)
    .map((x) => x.label);
  const extra = p.highball && w.highball ? ' · 하이볼 추천' : '';
  return `${top.join('·')} 취향에 맞음${extra}`;
}

/** 예산 안 Top N + 예산을 조금 넘는 "한 단계 위" 1개 */
export function recommend(p: BtiProfile, all: Whisky[], n = 3): { picks: BtiPick[]; stepUp?: BtiPick } {
  const ranked = all
    .filter((w) => w.flavor)
    .map((w) => ({ whisky: w, fit: score(p, w), reason: reason(p, w) }))
    .sort((a, b) => b.fit - a.fit);
  const inBudget = ranked.filter((r) => r.whisky.price == null || r.whisky.price <= p.budget);
  const picks: BtiPick[] = [];
  const brands = new Set<string>();
  for (const r of inBudget) {
    const b = r.whisky.brand ?? r.whisky.id;
    if (brands.has(b)) continue; // 브랜드 하나당 1개
    brands.add(b);
    picks.push(r);
    if (picks.length >= n) break;
  }
  const stepUp =
    p.budget < 999
      ? ranked.find((r) => r.whisky.price != null && r.whisky.price > p.budget && r.whisky.price <= p.budget * 2.5 && !brands.has(r.whisky.brand ?? ''))
      : undefined;
  return { picks: picks.map((r) => ({ ...r, fit: Math.min(1, r.fit) })), stepUp };
}
