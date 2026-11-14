// 단일 파일 zip 풀기 — 의존성 없이 Node 내장 zlib만 쓴다 (순수 함수, 테스트 대상).
// Iowa 새 API(idh-be.iowa.gov)가 JSON을 zip으로 감싸서 준다. 저장(0)·deflate(8) 방식만 지원.
import { inflateRawSync } from 'node:zlib';

export function isZip(buf) {
  return buf.length > 4 && buf.readUInt32LE(0) === 0x04034b50;
}

/** zip의 첫 번째 파일 내용을 Buffer로 돌려준다 */
export function readFirstZipEntry(buf) {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('zip: 끝 레코드(EOCD)를 찾지 못함');
  const cd = buf.readUInt32LE(eocd + 16); // 중앙 디렉터리 시작
  if (buf.readUInt32LE(cd) !== 0x02014b50) throw new Error('zip: 중앙 디렉터리 형식 오류');
  const method = buf.readUInt16LE(cd + 10);
  const csize = buf.readUInt32LE(cd + 20);
  const off = buf.readUInt32LE(cd + 42);
  if (csize === 0xffffffff || off === 0xffffffff) throw new Error('zip: ZIP64는 지원하지 않음');
  const start = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
  const raw = buf.subarray(start, start + csize);
  if (method === 0) return raw;
  if (method === 8) return inflateRawSync(raw);
  throw new Error(`zip: 지원하지 않는 압축 방식 ${method}`);
}

/** 줄 단위 JSON(NDJSON) 또는 JSON 배열 텍스트 → 객체 배열 */
export function parseJsonRows(text) {
  const t = text.trim();
  if (t.startsWith('[')) return JSON.parse(t);
  return t.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}
