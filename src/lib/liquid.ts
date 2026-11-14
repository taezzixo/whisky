// 위스키의 "액체 색" — 캐스크와 숙성 연수로 추정한 색. 도감의 대표 시각 요소.
// 실제 색을 측정한 값이 아니라 캐스크 영향의 상대 비교용 추정이다(화면에 "추정" 표기).

import type { Whisky } from '../types.ts';

/** 밝은 볏짚색 → 마호가니 6단계 */
export const LIQUID_RAMP = ['#F2D58C', '#E4B758', '#D0913A', '#B86C29', '#94471D', '#6B2B15'] as const;
export const LIQUID_NAMES = ['볏짚', '황금', '호박', '구리', '적갈', '마호가니'] as const;

/** 0(가장 옅음)~5(가장 짙음) 연속 점수 */
export function liquidScore(w: Pick<Whisky, 'casks' | 'age' | 'type' | 'abv'>): number {
  const c = new Set(w.casks ?? []);
  let s = 1; // 재사용 버번 통 기준
  if (c.has('virgin-oak')) s = 2.4; // 새 오크(미국 위스키)
  if (c.has('rum')) s = Math.max(s, 1.6);
  if (c.has('wine')) s = Math.max(s, 2.6);
  if (c.has('port')) s = Math.max(s, 2.9);
  if (c.has('sherry')) s = Math.max(s, c.size === 1 ? 3.7 : 2.8); // 셰리 단독이면 더 짙다
  if (c.has('mizunara')) s += 0.2;
  const age = w.age ?? 0;
  s += age >= 21 ? 1.3 : age >= 16 ? 0.9 : age >= 12 ? 0.4 : 0;
  if ((w.abv ?? 0) >= 55) s += 0.3; // 캐스크 스트렝스
  if (w.type === 'grain' || w.type === 'blended') s -= 0.4;
  return Math.max(0, Math.min(5, s));
}

/** 점수를 램프 사이에서 보간한 hex 색 */
export function liquidColor(w: Pick<Whisky, 'casks' | 'age' | 'type' | 'abv'>): string {
  const s = liquidScore(w);
  const i = Math.min(LIQUID_RAMP.length - 2, Math.floor(s));
  return mix(LIQUID_RAMP[i], LIQUID_RAMP[i + 1], s - i);
}

export function liquidName(w: Pick<Whisky, 'casks' | 'age' | 'type' | 'abv'>): string {
  return LIQUID_NAMES[Math.round(liquidScore(w))];
}

function mix(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((k) => parseInt(a.slice(k, k + 2), 16));
  const pb = [1, 3, 5].map((k) => parseInt(b.slice(k, k + 2), 16));
  return '#' + pa.map((v, k) => Math.round(v + (pb[k] - v) * t).toString(16).padStart(2, '0')).join('');
}
