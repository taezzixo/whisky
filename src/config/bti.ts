// 위스키BTI 문항과 결과 유형. 문항·점수를 바꿀 때는 BTI_VERSION 을 올린다
// (저장된 결과에 버전이 남아 있어 언제 기준으로 나온 결과인지 알 수 있다).

import type { AxisKey } from './flavor.ts';

export const BTI_VERSION = 'bti-v1';

export type Effect = Partial<Record<AxisKey, number>>;

export interface Choice {
  label: string;
  emoji: string;
  effect?: Effect; // 맛 축 가감
  budget?: number; // 예산 상한 (만원)
  highball?: boolean;
  adventure?: number; // 낯선 맛 선호 (-1~+1)
}

export interface Question {
  id: string;
  title: string;
  hint?: string;
  choices: Choice[];
}

export const QUESTIONS: Question[] = [
  {
    id: 'coffee',
    title: '카페에서 가장 자주 고르는 메뉴는?',
    choices: [
      { emoji: '☕', label: '산미 있는 아메리카노', effect: { fruity: 1.5, floral: 1, body: -0.5 } },
      { emoji: '🥛', label: '묵직한 라떼·플랫화이트', effect: { body: 1.5, malty: 1, nutty: 0.5 } },
      { emoji: '🍦', label: '달콤한 바닐라라떼', effect: { sweet: 1.5, oaky: 1.5 } },
      { emoji: '🍫', label: '모카·초콜릿 음료', effect: { nutty: 1.5, winey: 1, sweet: 0.5 } },
    ],
  },
  {
    id: 'smoke',
    title: '캠프파이어 장작 냄새나 정로환 같은 약 냄새, 어떠세요?',
    hint: '피트(스모키) 위스키 선호도를 봅니다.',
    choices: [
      { emoji: '🔥', label: '좋아요, 진할수록 좋아요', effect: { smoky: 3.5, body: 0.5 }, adventure: 1 },
      { emoji: '🏕️', label: '은은하면 괜찮아요', effect: { smoky: 1.5 } },
      { emoji: '🙅', label: '싫어요', effect: { smoky: -2 } },
    ],
  },
  {
    id: 'dessert',
    title: '디저트를 하나 고른다면?',
    choices: [
      { emoji: '🍇', label: '건포도 가득 과일 케이크', effect: { winey: 2, fruity: 1, nutty: 0.5 } },
      { emoji: '🍮', label: '캐러멜 푸딩', effect: { sweet: 1.5, oaky: 1 } },
      { emoji: '🍏', label: '상큼한 사과·배 타르트', effect: { fruity: 2, floral: 0.5 } },
      { emoji: '🥨', label: '디저트보다 짭짤한 프레첼', effect: { malty: 1.5, spicy: 0.5, sweet: -0.5 } },
    ],
  },
  {
    id: 'spice',
    title: '매운 음식이나 후추·시나몬 같은 향신료는?',
    choices: [
      { emoji: '🌶️', label: '자극적인 게 좋아요', effect: { spicy: 2 }, adventure: 0.5 },
      { emoji: '🙂', label: '적당히', effect: { spicy: 0.5 } },
      { emoji: '🍯', label: '부드러운 게 좋아요', effect: { spicy: -1, sweet: 0.5 } },
    ],
  },
  {
    id: 'body',
    title: '와인이나 맥주를 마신다면?',
    choices: [
      { emoji: '🍷', label: '진한 레드 와인·흑맥주', effect: { body: 1.5, winey: 1 } },
      { emoji: '🥂', label: '가벼운 화이트 와인·라거', effect: { body: -1, floral: 1, fruity: 0.5 } },
      { emoji: '🍺', label: '홉 향 강한 IPA', effect: { floral: 1, spicy: 0.5, malty: 0.5 }, adventure: 0.5 },
      { emoji: '🚫', label: '술은 위스키가 처음', effect: { body: -0.5, sweet: 0.5 }, adventure: -0.5 },
    ],
  },
  {
    id: 'serve',
    title: '위스키를 주로 어떻게 마시나요 (마시고 싶나요)?',
    choices: [
      { emoji: '🧊', label: '하이볼', highball: true, effect: { body: -0.5 } },
      { emoji: '🥃', label: '니트·온더락', effect: { body: 0.5 } },
      { emoji: '🤷', label: '아직 모르겠어요' },
    ],
  },
  {
    id: 'budget',
    title: '한 병에 쓸 수 있는 예산은?',
    hint: '참고 가격(700ml) 기준입니다.',
    choices: [
      { emoji: '💸', label: '5만 원 이하', budget: 5 },
      { emoji: '💳', label: '5~10만 원', budget: 10 },
      { emoji: '💎', label: '10~20만 원', budget: 20 },
      { emoji: '👑', label: '20만 원 이상도 OK', budget: 999 },
    ],
  },
  {
    id: 'adventure',
    title: '새로운 맛에 대한 태도는?',
    choices: [
      { emoji: '🧭', label: '낯설수록 재밌다', adventure: 1 },
      { emoji: '🛋️', label: '실패 없는 맛이 최고', adventure: -1 },
    ],
  },
];

/** 출발점: 무난한 입문 위스키 정도의 취향 */
export const BASE_TASTE: Record<AxisKey, number> = {
  sweet: 2.5, smoky: 0.5, body: 2.5, spicy: 1.5, fruity: 2.5, floral: 1.5, malty: 2, oaky: 2, nutty: 1.5, winey: 1,
};

// 결과 유형: 4개 축(피트/클린 · 리치/라이트 · 셰리/버번 · 스파이시/메로우) → 16유형
export const TYPE_PREFIX: Record<string, string> = {
  PR: '모닥불 앞의',
  PL: '바닷바람 속',
  CR: '벨벳 소파 위',
  CL: '햇살 테라스의',
};
export const TYPE_SUFFIX: Record<string, { name: string; emoji: string; desc: string }> = {
  SX: { name: '향신료 상인', emoji: '🧭', desc: '건과일·셰리의 깊은 단맛에 후추 같은 자극을 즐기는 타입' },
  SM: { name: '디저트 셰프', emoji: '🍰', desc: '건포도·초콜릿처럼 진하고 부드러운 단맛을 좋아하는 타입' },
  BX: { name: '카우보이', emoji: '🤠', desc: '바닐라·오크에 호밀 같은 스파이스가 더해진 맛을 좋아하는 타입' },
  BM: { name: '바닐라 러버', emoji: '🍦', desc: '꿀·바닐라·과일의 편안한 단맛을 좋아하는 타입' },
};
