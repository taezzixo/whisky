// 위스키 도감 공통 형식. 청약맵 기본 구성도의 "고정 id · 출처 · 위치 · 원문 링크 · 품질" 원칙을 따른다.
// 수집 스크립트(scripts/)와 화면(src/)이 같은 형식을 쓴다.

/** 맛 벡터 10축. 순서는 src/config/flavor.ts 의 AXES 와 같다. 각 값 0~5. */
export type FlavorVector = number[];

export type WhiskyType =
  | 'single-malt'
  | 'blended-malt'
  | 'blended'
  | 'grain'
  | 'bourbon'
  | 'tennessee'
  | 'rye'
  | 'pot-still'
  | 'other';

export type Cask = 'bourbon' | 'sherry' | 'port' | 'wine' | 'rum' | 'mizunara' | 'virgin-oak' | 'other';

/** 데이터 등급: A 공식·검수 / B 커뮤니티 검증 / C 추정(시드·AI) */
export type Grade = 'A' | 'B' | 'C';

export type SourceId = 'seed' | 'wikidata' | 'off' | 'iowa' | 'manual';

export interface SourceRef {
  source: SourceId;
  url?: string;
}

export interface Whisky {
  /** 고정 id. 출처 접두어: seed- / wd- / off- / ia- / manual- . 바꾸면 위시리스트·링크가 깨진다. */
  id: string;
  source: SourceId;
  name: string; // 영문 공식명
  nameKo?: string;
  brand?: string;
  distillery?: string;
  country: string; // 한국어 국가명 (스코틀랜드, 미국 …)
  region?: string; // 스페이사이드, 아일라, 켄터키 …
  type: WhiskyType;
  /** 숙성 연수. 숙성 표기 없음(NAS)은 null */
  age?: number | null;
  abv?: number; // %
  casks?: Cask[];
  peated?: boolean;
  /** 국내 참고 가격 (만원, 700ml 기준, 대략). 판매 정보가 아니다. */
  price?: number;
  /** 하이볼에 잘 어울리는지 */
  highball?: boolean;
  flavor?: FlavorVector;
  tags?: string[]; // 대표 아로마 태그 3개 (한국어)
  summary?: string; // 2줄 이내 설명
  lat?: number; // 증류소 좌표 (있을 때)
  lng?: number;
  barcode?: string[];
  /** 실제 사진 (Open Food Facts, CC BY-SA). src 는 사이트 기준 상대 경로 */
  image?: { src: string; credit: string; license: string; url: string };
  grade: Grade;
  refs?: SourceRef[];
  manual?: boolean;
}

export interface SourceStatus {
  id: SourceId;
  ok: boolean;
  count: number;
  error?: string;
}

export interface WhiskiesFile {
  generatedAt: string;
  sample: boolean;
  sources: SourceStatus[];
  whiskies: Whisky[];
}

export interface Overrides {
  hide?: string[];
  patch?: Record<string, Partial<Whisky>>;
  manual?: Whisky[];
}
