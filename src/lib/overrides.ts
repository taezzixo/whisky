// 관리자 수동 보정 병합 — 브라우저와 prerender 가 같은 규칙을 쓴다 (기본 구성도 D-5).

import type { Overrides, Whisky } from '../types.ts';

export function applyOverrides(items: Whisky[], ov?: Overrides | null): Whisky[] {
  if (!ov) return items;
  const hide = new Set(ov.hide ?? []);
  const out = items.filter((w) => !hide.has(w.id)).map((w) => (ov.patch?.[w.id] ? { ...w, ...ov.patch[w.id] } : w));
  const ids = new Set(out.map((w) => w.id));
  for (const m of ov.manual ?? []) {
    if (m?.id && m.name && !ids.has(m.id) && !hide.has(m.id)) out.push({ ...m, grade: m.grade ?? 'C', manual: true });
  }
  return out;
}

/** 한글·영문·공백 무시 검색 */
export function normalizeQuery(s: string): string {
  return s.toLowerCase().replace(/[\s'’`.\-·]/g, '');
}

export function searchWhiskies(items: Whisky[], q: string, limit = 30): Whisky[] {
  const nq = normalizeQuery(q);
  if (!nq) return items.slice(0, limit);
  const hay = (w: Whisky) => normalizeQuery([w.name, w.nameKo, w.brand, w.distillery, w.region, ...(w.tags ?? [])].join(' '));
  return items
    .map((w) => {
      const h = hay(w);
      const i = h.indexOf(nq);
      return { w, rank: i < 0 ? -1 : i === 0 ? 2 : 1 };
    })
    .filter((x) => x.rank > 0)
    .sort((a, b) => b.rank - a.rank || (b.w.flavor ? 1 : 0) - (a.w.flavor ? 1 : 0))
    .slice(0, limit)
    .map((x) => x.w);
}
