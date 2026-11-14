// Iowa Liquor Products (Iowa 주정부 공공 데이터): 미국 유통 위스키 SKU·도수·UPC.
// 2026년 data.iowa.gov가 Socrata에서 새 포털로 옮겨 옛 주소(gckp-fe7r)는 404.
// 새 API는 데이터셋 1029의 전체 행을 zip(안에 줄 단위 JSON)으로 준다. 번호가 바뀌면 IOWA_DATASET으로 덮어쓴다.
// 목록 페이지: https://data.iowa.gov/catalog/dataset/1029
import { getBuffer } from './http.mjs';
import { parseIowa } from '../lib/normalize.mjs';
import { isZip, parseJsonRows, readFirstZipEntry } from '../lib/zip.mjs';

const DATASET = process.env.IOWA_DATASET ?? '1029';

export async function fetchIowa() {
  const buf = await getBuffer(`https://idh-be.iowa.gov/api/v1/datasets/${DATASET}/rows.json`, { timeoutMs: 180000 });
  const text = (isZip(buf) ? readFirstZipEntry(buf) : buf).toString('utf8');
  return parseIowa(parseJsonRows(text));
}
