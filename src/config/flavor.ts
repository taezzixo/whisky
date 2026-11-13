// 맛 축과 추천 가중치 — 기준값은 이 파일 한 곳에만 둔다.
// 가중치를 바꿀 때는 새 버전을 배열 맨 앞에 "추가"하고 기존 버전은 지우지 않는다 (청약맵 criteria.ts 방식).

import type { Cask, WhiskyType } from '../types.ts';

export const AXES = [
  { key: 'sweet', label: '단맛' },
  { key: 'smoky', label: '스모키·피트' },
  { key: 'body', label: '바디' },
  { key: 'spicy', label: '스파이시' },
  { key: 'fruity', label: '과일' },
  { key: 'floral', label: '꽃·허브' },
  { key: 'malty', label: '몰티·곡물' },
  { key: 'oaky', label: '오크·바닐라' },
  { key: 'nutty', label: '견과·초콜릿' },
  { key: 'winey', label: '셰리·와인' },
] as const;

export type AxisKey = (typeof AXES)[number]['key'];
export const AXIS_INDEX = Object.fromEntries(AXES.map((a, i) => [a.key, i])) as Record<AxisKey, number>;

/** 레이더 차트에 보이는 5축 */
export const RADAR_AXES: AxisKey[] = ['sweet', 'smoky', 'body', 'spicy', 'fruity'];

export interface SimilarityWeights {
  id: string;
  effectiveFrom: string;
  flavor: number;
  tags: number;
  cask: number;
  meta: number;
  spec: number;
  /** 같은 브랜드 결과 최대 개수 (다양성) */
  maxPerBrand: number;
  /** "더 저렴한 대체"로 볼 가격 비율 상한 */
  cheaperRatio: number;
}

export const SIMILARITY_VERSIONS: SimilarityWeights[] = [
  { id: 'v1', effectiveFrom: '2026-11-13', flavor: 0.55, tags: 0.15, cask: 0.1, meta: 0.1, spec: 0.1, maxPerBrand: 2, cheaperRatio: 0.75 },
];

export const currentWeights = (): SimilarityWeights => SIMILARITY_VERSIONS[0];

export const TYPE_LABEL: Record<WhiskyType, string> = {
  'single-malt': '싱글몰트',
  'blended-malt': '블렌디드 몰트',
  blended: '블렌디드',
  grain: '그레인',
  bourbon: '버번',
  tennessee: '테네시',
  rye: '라이',
  'pot-still': '싱글 팟 스틸',
  other: '기타',
};

export const CASK_LABEL: Record<Cask, string> = {
  bourbon: '버번',
  sherry: '셰리',
  port: '포트',
  wine: '와인',
  rum: '럼',
  mizunara: '미즈나라',
  'virgin-oak': '새 오크',
  other: '기타',
};

export const GRADE_LABEL = { A: '공식·검수', B: '커뮤니티 검증', C: '추정' } as const;
