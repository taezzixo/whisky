// Iowa Liquor Products (data.iowa.gov, 공공 데이터): 미국 유통 위스키 SKU·도수·UPC.
// Socrata API. 데이터셋 id 가 바뀌면 IOWA_DATASET 환경변수로 덮어쓴다.
import { getJson } from './http.mjs';
import { parseIowa } from '../lib/normalize.mjs';

const DATASET = process.env.IOWA_DATASET ?? 'gckp-fe7r';

export async function fetchIowa() {
  const rows = [];
  for (let offset = 0; offset < 50000; offset += 10000) {
    const url = `https://data.iowa.gov/resource/${DATASET}.json?$limit=10000&$offset=${offset}`;
    const page = await getJson(url);
    rows.push(...page);
    if (page.length < 10000) break;
  }
  return parseIowa(rows);
}
