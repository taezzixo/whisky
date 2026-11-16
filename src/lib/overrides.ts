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

/** 같은 위스키를 다르게 적는 한국어 표기 → 도감 표기 (긴 것부터 바꾼다) */
export const SPELLING: [string, string][] = [
  ['맥켈란', '맥캘란'], ['맥칼란', '맥캘란'], ['맥켈렌', '맥캘란'],
  ['라프로이그', '라프로익'], ['라프로잉', '라프로익'],
  ['탈리스카', '탈리스커'], ['탈리스키', '탈리스커'],
  ['글렌모란지', '글렌모렌지'], ['글렌모렌기', '글렌모렌지'],
  ['보우모어', '보모어'], ['보모아', '보모어'],
  ['야마자끼', '야마자키'], ['야마사키', '야마자키'],
  ['하큐슈', '하쿠슈'], ['하쿠수', '하쿠슈'],
  ['부나하번', '부나하벤'], ['부나하분', '부나하벤'],
  ['쿠일라', '쿨일라'], ['쿨라일라', '쿨일라'], ['쿨 일라', '쿨일라'],
  ['아드백', '아드벡'], ['아드베그', '아드벡'],
  ['라가부린', '라가불린'], ['라가블린', '라가불린'],
  ['브룩클라디', '브룩라디'], ['브루클라디', '브룩라디'], ['브룩라디', '브룩라디'],
  ['애버라워', '아벨라워'], ['아베라워', '아벨라워'], ['애벌라워', '아벨라워'],
  ['글렌드로냑', '글렌드로낙'], ['글렌드로낙', '글렌드로낙'],
  ['글렌피딕', '글렌피딕'], ['글렌피디크', '글렌피딕'],
  ['글렌리벳', '글렌리벳'], ['글렌리벧', '글렌리벳'],
  ['달모아', '달모어'], ['카바란', '카발란'], ['카바랑', '카발란'],
  ['선토리', '산토리'], ['니카', '닛카'], ['싱글턴', '싱글톤'],
  ['글렌알라치', '글렌알라키'], ['몽키쇼더', '몽키숄더'], ['몽키숄다', '몽키숄더'],
  ['버펄로', '버팔로'], ['블랑톤', '블랜튼'], ['블렌튼', '블랜튼'], ['노브크릭', '놉크릭'],
  ['제미슨', '제임슨'], ['듀워스', '듀어스'], ['발렌타인스', '발렌타인'],
  ['잭다니엘스', '잭다니엘'], ['로열살루트', '로얄살루트'], ['시바스리걸', '시바스리갈'],
  ['조니웍커', '조니워커'], ['죠니워커', '조니워커'], ['스프링뱅커', '스프링뱅크'],
  ['1리터', '1l'], ['리터', 'l'],
];

/** 한글·영문·공백·문장부호를 무시하고, 흔한 다른 표기를 도감 표기로 바꾼다 */
export function normalizeQuery(s: string): string {
  let t = s.toLowerCase().replace(/[\s'’`.\-·*]/g, '');
  for (const [from, to] of SPELLING) if (t.includes(from)) t = t.split(from).join(to);
  return t;
}

/** 검색 대상 문자열: 이름·브랜드·증류소·지역·향 + 용량·면세 여부 */
function haystack(w: Whisky): string {
  const extra = [
    ...(w.prices ?? []).map((p) => (p.ml >= 1000 ? `${p.ml / 1000}l` : `${p.ml}ml`)),
    w.dutyFree || w.prices?.some((p) => p.where === 'dutyfree') ? '면세 면세점 dutyfree' : '',
  ];
  return normalizeQuery([w.name, w.nameKo, w.brand, w.distillery, w.region, ...(w.tags ?? []), ...extra].join(' '));
}

/** 띄어 쓴 낱말이 모두 들어 있으면 찾는다. 통째로 이어서 맞으면 더 앞에. */
export function searchWhiskies(items: Whisky[], q: string, limit = 30): Whisky[] {
  const nq = normalizeQuery(q);
  if (!nq) return items.slice(0, limit);
  const tokens = q.split(/\s+/).map(normalizeQuery).filter(Boolean);
  return items
    .map((w) => {
      const h = haystack(w);
      const i = h.indexOf(nq);
      const rank = i === 0 ? 3 : i > 0 ? 2 : tokens.length > 1 && tokens.every((t) => h.includes(t)) ? 1 : 0;
      return { w, rank };
    })
    .filter((x) => x.rank > 0)
    .sort((a, b) => b.rank - a.rank || (b.w.flavor ? 1 : 0) - (a.w.flavor ? 1 : 0))
    .slice(0, limit)
    .map((x) => x.w);
}
