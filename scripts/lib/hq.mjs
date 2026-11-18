// 고화질 병 사진(배경 제거) 하루 일정량 수집 — 순수 함수만 둔다(테스트 대상).
// 기준(2026-11-18 사용자 요청): 햇빛·반사·그을림 없는 선명한 사진, 병 1개만, 자유 라이선스 원본.
import { commonsTitleText, freeLicense, imageMatches } from './images.mjs';
import { normName } from './normalize.mjs';

export const HQ_RETRY_DAYS = 30;

/** 병 1개 사진이 아닐 가능성이 큰 제목 (증류소·잔·상자·여러 병·진열대 등) */
const NEGATIVE =
  /\b(distiller(y|ies)|stills?|warehouse|glass(es)?|dram|box(ed)?|gift|tube|set|collection|bottles|shelf|shelves|bar|map|logo|advert|poster|sign|label only|cork|cap|tasting|flight|miniatures?|empty|leer|tour|visitor|building|bay|statue|marker)\b/i;

/** 제품 구분에 쓰지 않는 흔한 낱말 */
const GENERIC = new Set(['year', 'years', 'old', 'aged', 'whisky', 'whiskey', 'scotch', 'bourbon', 'straight', 'kentucky', 'tennessee', 'annual', 'release', 'edition', 'select', 'bottled', 'the']);

/** 연수 없는 위스키를 같은 브랜드의 다른 병과 가르는 낱말 (예: Ardbeg Uigeadail → uigeadail) */
export function expressionTokens(w) {
  const brand = new Set(normName(w.brand ?? '').split(' '));
  return normName(w.name)
    .split(' ')
    .filter((t) => t.length >= 3 && !brand.has(t) && !GENERIC.has(t) && !/^\d+$/.test(t));
}

/**
 * 제목이 이 위스키의 단독 병 사진처럼 보이는지.
 *  - 금지어(증류소·잔·상자·여러 병 등)가 없고, 브랜드·연수가 맞아야 한다(imageMatches)
 *  - 연수가 없는 위스키는 제품 고유 낱말도 모두 있어야 한다(브랜드만 같은 다른 병을 거른다)
 */
export function hqTitleOk(w, title) {
  const text = commonsTitleText(title);
  if (NEGATIVE.test(text)) return false;
  if (!imageMatches(w, { product_name: text, brands: '' })) return false;
  if (w.age) return true;
  const compact = normName(text).replace(/ /g, '');
  return expressionTokens(w).every((t) => compact.includes(t));
}

/**
 * 오늘 처리할 위스키 순서.
 *  1순위: 사용자 제공 캡처(출처·라이선스 미확인) → 자유 라이선스로 바꾸는 게 가장 급하다
 *  2순위: 배경이 있는 일반 사진(작고 배경이 섞임)
 *  3순위: 사진 없음
 * 같은 순위 안에서는 국내 판매·면세 가격이 있는 위스키(많이 찾는 병)를 앞에.
 * 이미 고화질(hq)인 것과 30일 안에 못 찾은 것은 뺀다.
 */
export function hqQueue(seed, db, now = Date.now()) {
  const images = db?.images ?? {};
  const misses = db?.hq?.misses ?? {};
  const rank = (w) => {
    const im = images[w.id];
    if (im?.hq) return -1;
    if (!im) return 3;
    if (im.credit === '사용자 제공 이미지') return 1;
    if (!im.cutout) return 2;
    return -1; // 다른 경로로 만든 누끼는 건드리지 않는다
  };
  return seed
    .map((w, i) => ({ w, i, r: rank(w), popular: w.prices?.length || w.price ? 0 : 1 }))
    .filter((x) => x.r > 0 && !(misses[x.w.id] && now - Date.parse(misses[x.w.id]) < HQ_RETRY_DAYS * 864e5))
    .sort((a, b) => a.r - b.r || a.popular - b.popular || a.i - b.i)
    .map((x) => x.w);
}

/** 위키미디어 공용 검색어 (브랜드+연수, 전체 이름) */
export function hqQueries(w) {
  const brand = (w.brand ?? w.name).replace(/^The /, '');
  const name = w.name.replace(/^The /, '');
  return w.age ? [...new Set([`${brand} ${w.age}`, name])] : [name]; // 연수가 없으면 브랜드만으로는 찾지 않는다
}

/** 검색 결과 → 후보(최대 n장): 자유 라이선스, 세로로 긴 고해상도, 제목 일치, 수동 제외 목록 밖 */
export function hqCandidates(w, pages = [], reject = [], n = 3) {
  return pages
    .map((p) => ({ title: p.title, ii: p.imageinfo?.[0] }))
    .filter(({ title, ii }) =>
      ii &&
      /^image\/(jpeg|png)$/.test(ii.mime) &&
      freeLicense(ii.extmetadata?.LicenseShortName?.value) &&
      ii.height >= 1200 &&
      ii.height >= ii.width * 1.4 &&
      !reject.includes(title) &&
      hqTitleOk(w, title),
    )
    .sort((a, b) => b.ii.height - a.ii.height)
    .slice(0, n);
}

/** 내려받을 주소: 폭이 1280px보다 크면 위키미디어 표준 1280px 판(요청 제한이 덜하고 충분히 선명), 아니면 원본 */
export function hqDownloadUrl(ii) {
  const url = String(ii.url).split('?')[0];
  if (ii.width <= 1280) return url;
  const file = url.split('/').pop();
  return `${url.replace('/wikipedia/commons/', '/wikipedia/commons/thumb/')}/1280px-${file}`;
}

/**
 * 배경 제거 결과 품질 검사 (scripts/hq/cutout.py 가 재는 값).
 *  objects   덩어리 수 — 병 1개만
 *  glare     병 안에서 하얗게 날아간 비율(%) — 햇빛·반사광
 *  sheen     병 안에서 밝고 색이 빠진 얼룩 비율(%) — 창문·조명 반사 (2026-11-18 측정: 통과시킨 사진 ≤1.1, 거른 사진 ≥4)
 *  srcH      원본에서 병 높이(px) — 선명도
 *  ratio     폭/높이 — 병 모양
 *  edge      병이 사진 가장자리에 닿음 — 잘린 병
 *  fill      병 영역/외곽 상자 — 상자·여러 병이 붙은 덩어리 거르기
 *  coverage  병 영역/사진 전체 — 배경 제거 실패(통째로 남음) 거르기
 */
export function hqQuality(m) {
  const why = [];
  if (m.objects !== 1) why.push(`덩어리 ${m.objects}개`);
  if (m.glare >= 1.5) why.push(`날아간 부분 ${m.glare}%`);
  if ((m.sheen ?? 0) >= 3) why.push(`반사 얼룩 ${m.sheen}%`);
  if (m.srcH < 900) why.push(`병 높이 ${m.srcH}px`);
  if (m.ratio < 0.18 || m.ratio > 0.62) why.push(`비율 ${m.ratio}`);
  if (m.edge) why.push('가장자리에서 잘림');
  if (m.fill < 0.45) why.push(`채움 ${m.fill}`);
  if (m.coverage > 0.85) why.push('배경 제거 실패');
  return { ok: why.length === 0, why };
}
