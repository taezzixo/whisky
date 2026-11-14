// Open Food Facts (ODbL): 위스키 카테고리(en:whisky, 하위 카테고리 포함) 제품의 바코드·이름·도수.
// 주의: 카테고리 태그는 'whisky'(단수). 'whiskies'는 없는 태그라 0건이 된다 (2026-11-14 확인, 약 720건).
// 이용 조건: 출처 표기, 요청 간격 지키기(검색 API는 분당 10회 이하 권장).
import { getJson } from './http.mjs';
import { parseOff } from '../lib/normalize.mjs';

// nutriments 필드를 요청하면 서버가 503을 돌려준다(2026-11-14 확인). 도수는 제품명 표기(예: 40%)에서 읽는다.
const FIELDS = 'code,product_name,brands,countries_tags,categories_tags,quantity';
const MAX_PAGES = Number(process.env.OFF_MAX_PAGES ?? 40);

export async function fetchOff() {
  const out = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=whisky&fields=${FIELDS}&page_size=100&page=${page}`;
    const json = await getJson(url, { tries: 4, baseDelayMs: 20000 }); // 요청 제한(503) 시 20·40·80초 대기 후 재시도
    const products = json.products ?? [];
    out.push(...parseOff(products));
    if (products.length < 100) break;
    await new Promise((r) => setTimeout(r, 7000)); // 분당 10회 이하
  }
  return out;
}
