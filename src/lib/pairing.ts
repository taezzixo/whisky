// 푸드 페어링·마시는 법 — 맛 벡터와 캐스크로 만든 규칙 기반 추정 가이드(PRD F-107).
// 전문가 추천이 아니라 일반적인 짝 맞추기 원리를 적용한 참고용이다.

import type { Whisky } from '../types.ts';

export interface Guide {
  foods: string[]; // 최대 4개
  serve: { label: string; why: string }[]; // 추천 순
}

const f = (w: Whisky, i: number) => w.flavor?.[i] ?? 0;

export function pairingGuide(w: Whisky): Guide {
  const sweet = f(w, 0), smoky = f(w, 1), body = f(w, 2), spicy = f(w, 3), fruity = f(w, 4), floral = f(w, 5), oaky = f(w, 7), nutty = f(w, 8), winey = f(w, 9);
  const foods: [number, string][] = [];
  const add = (score: number, food: string) => score > 0 && foods.push([score, food]);
  add(winey * 1.2 + nutty, '다크 초콜릿');
  add(winey + fruity * 0.5, '건무화과·대추야자');
  add(smoky * 1.3, '훈제 연어');
  add(smoky + body * 0.5 - sweet * 0.3, '굴·해산물 구이');
  add(smoky * 0.8 + body, '바비큐·스테이크');
  add(oaky + sweet * 0.8 - smoky, '크렘 브륄레·캐러멜 디저트');
  add(nutty * 1.1 + body * 0.3, '구운 견과류');
  add(fruity + floral - body * 0.5, '사과·배 같은 생과일');
  add(floral + fruity * 0.5 - smoky, '흰살 생선·카르파초');
  add(body + winey * 0.6, '숙성 치즈(체다·콩테)');
  add(spicy * 1.1 - sweet * 0.2, '페퍼로니·살라미');
  add(sweet + spicy * 0.5 - winey * 0.5, '시나몬 롤·애플파이');
  const top = foods.sort((a, b) => b[0] - a[0]).map((x) => x[1]).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);

  const serve: { score: number; label: string; why: string }[] = [];
  const abv = w.abv ?? 40;
  serve.push({ score: body + winey * 0.5 + (w.age ?? 0) / 6, label: '니트', why: '향과 질감을 그대로 느끼기 좋습니다' });
  if (abv >= 50) serve.push({ score: 5, label: '물 몇 방울', why: `도수 ${abv}%라 물 몇 방울로 향이 열립니다` });
  serve.push({ score: sweet + oaky * 0.6 - fruity * 0.3, label: '온더락', why: '단맛과 오크가 차갑게 정돈됩니다' });
  if (w.highball || body <= 2.5) serve.push({ score: (w.highball ? 4 : 2) + fruity * 0.4 + smoky * 0.3 - (w.age ?? 0) / 8, label: '하이볼 (위스키 1 : 탄산수 3~4)', why: smoky >= 3 ? '스모크가 탄산과 함께 시원하게 퍼집니다' : '가벼운 과일 향이 탄산과 잘 맞습니다' });
  return { foods: top, serve: serve.sort((a, b) => b.score - a.score).slice(0, 3).map(({ label, why }) => ({ label, why })) };
}
