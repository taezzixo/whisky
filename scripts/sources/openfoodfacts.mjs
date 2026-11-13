// Open Food Facts (ODbL): 위스키 카테고리 제품의 바코드·이름·도수.
// 이용 조건: 출처 표기, 요청 간격 지키기(검색 API는 분당 10회 이하 권장).
import { getJson } from './http.mjs';
import { parseOff } from '../lib/normalize.mjs';

const FIELDS = 'code,product_name,product_name_en,brands,alcohol_value,nutriments,countries_tags,origins,categories_tags';
const MAX_PAGES = Number(process.env.OFF_MAX_PAGES ?? 40);

export async function fetchOff() {
  const out = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://world.openfoodfacts.org/api/v2/search?categories_tags_en=whiskies&fields=${FIELDS}&page_size=100&page=${page}`;
    const json = await getJson(url);
    const products = json.products ?? [];
    out.push(...parseOff(products));
    if (products.length < 100) break;
    await new Promise((r) => setTimeout(r, 7000)); // 분당 10회 이하
  }
  return out;
}
