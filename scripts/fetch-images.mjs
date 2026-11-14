#!/usr/bin/env node
// 시드 위스키의 실제 사진 수집 (Open Food Facts, CC BY-SA).
// 1) 바코드가 있는 위스키: Open Food Facts 제품 API(분당 100회 한도 안에서)로 앞면 사진.
// 2) 그래도 없으면: 위키미디어 공용(Commons) 검색 — CC BY / CC BY-SA / CC0 / 퍼블릭 도메인만.
// 3) 그래도 없으면: Open Food Facts 이름 검색(분당 10회 한도) — 한 번에 IMAGE_SEARCH_MAX(기본 40)개까지.
// 결과는 data/images.json(사진 정보·못 찾은 기록)과 public/img/w/<id>.jpg 로 저장. 못 찾은 위스키는 30일 뒤 다시 찾는다.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { getBuffer, getJson, UA } from './sources/http.mjs';
import { attachImages, frontImageUrl, imageFile, imageMatches, IMAGE_CREDIT, IMAGE_LICENSE, pickCommons, stripHtml } from './lib/images.mjs';

const FIELDS = 'code,product_name,brands,image_front_url,selected_images';
const SEARCH_MAX = Number(process.env.IMAGE_SEARCH_MAX ?? 40);
const RETRY_DAYS = 30;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = async (p, d) => (existsSync(p) ? JSON.parse(await readFile(p, 'utf8')) : d);

async function main() {
  const seed = (await readJson('data/flavor-seed.json', { whiskies: [] })).whiskies;
  const dex = (await readJson('public/data/whiskies.json', { whiskies: [] })).whiskies;
  const barcodes = new Map(dex.map((w) => [w.id, w.barcode ?? []]));
  const db = await readJson('data/images.json', { images: {}, misses: {} });
  await mkdir('public/img/w', { recursive: true });
  const now = Date.now();
  const due = (id) => !db.images[id] && !(db.misses[id] && now - Date.parse(db.misses[id]) < RETRY_DAYS * 864e5);
  let found = 0, searched = 0, failed = 0;

  async function saveCommons(w, hit) {
    const ii = hit.ii;
    const url = ii.thumburl && /upload\.wikimedia\.org/.test(ii.thumburl) ? ii.thumburl : ii.url;
    if (ii.size > 3_000_000 && url === ii.url) return false;
    const buf = await getBuffer(url, { timeoutMs: 40000, headers: { 'User-Agent': UA } });
    if (buf.length < 2000) return false;
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[ii.mime] ?? 'jpg';
    const file = imageFile(w.id, ext);
    await writeFile(`public/${file}`, buf);
    const m = ii.extmetadata ?? {};
    db.images[w.id] = {
      file,
      source: url,
      product: ii.descriptionurl,
      credit: `${stripHtml(m.Artist?.value) || '작성자 미상'}, 위키미디어 공용`,
      license: m.LicenseShortName?.value ?? '',
      at: new Date().toISOString().slice(0, 10),
    };
    delete db.misses[w.id];
    found++;
    return true;
  }

  async function commons(w) {
    const brand = (w.brand ?? w.name).replace(/^The /, '');
    const q = `${brand} ${w.age ? `${w.age}` : ''} ${/bourbon|rye|tennessee/.test(w.type) ? 'whiskey' : 'whisky'} bottle`.replace(/\s+/g, ' ');
    const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(q)}&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=400&iiextmetadatafilter=LicenseShortName|Artist`;
    // 위키미디어는 짧은 시간에 몰아서 부르면 429를 준다 → 3초 간격, 429면 20·40초 기다렸다 다시
    const r = await getJson(api, { tries: 3, baseDelayMs: 20000, headers: { 'User-Agent': UA } });
    await sleep(3000);
    const hit = pickCommons(w, Object.values(r?.query?.pages ?? {}));
    return hit ? saveCommons(w, hit) : false;
  }

  async function save(w, product) {
    const url = frontImageUrl(product);
    if (!url) return false;
    const buf = await getBuffer(url, { timeoutMs: 30000 });
    if (buf.length < 2000 || buf[0] !== 0xff) return false; // JPEG 아님(오류 페이지 등)
    const file = imageFile(w.id);
    await writeFile(`public/${file}`, buf);
    db.images[w.id] = { file, source: url, product: `https://world.openfoodfacts.org/product/${product.code}`, credit: IMAGE_CREDIT, license: IMAGE_LICENSE, at: new Date().toISOString().slice(0, 10) };
    delete db.misses[w.id];
    found++;
    return true;
  }

  for (const w of seed) {
    if (!due(w.id)) continue;
    let ok = false;
    let attempted = false;
    try {
      for (const code of barcodes.get(w.id) ?? []) {
        attempted = true;
        let r = null;
        try {
          r = await getJson(`https://world.openfoodfacts.org/api/v2/product/${code}?fields=${FIELDS}`, { tries: 2, baseDelayMs: 5000 });
        } catch (e) {
          if (!/HTTP 404/.test(e.message)) throw e; // 404 = 이 바코드 제품이 없음 → 다음 바코드
        }
        await sleep(700);
        if (r?.product && imageMatches(w, r.product) && (await save(w, r.product))) { ok = true; break; }
      }
      if (!ok) {
        attempted = true;
        ok = await commons(w);
      }
      if (!ok && searched < SEARCH_MAX) {
        searched++;
        attempted = true;
        const q = encodeURIComponent(w.name);
        const r = await getJson(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&search_simple=1&json=1&page_size=8&fields=${FIELDS}`, { tries: 2, baseDelayMs: 15000 });
        await sleep(6500); // 검색은 분당 10회 이하
        for (const p of r?.products ?? []) if (imageMatches(w, p) && (await save(w, p))) { ok = true; break; }
      }
      if (!ok && attempted) db.misses[w.id] = new Date().toISOString().slice(0, 10);
    } catch (e) {
      failed++;
      console.error(`[image] ${w.id}: ${e.message}`);
      if (failed >= 15) { console.error('[image] 실패가 많아 이번 회차를 멈춥니다(요청 제한 가능성).'); break; }
    }
  }
  // 시드에서 빠진 위스키의 사진 정보는 지운다(파일은 남겨도 무해)
  for (const id of Object.keys(db.images)) if (!seed.some((w) => w.id === id)) delete db.images[id];
  await writeFile('data/images.json', JSON.stringify(db, null, 1));
  // 이미 만들어진 도감 파일에도 바로 반영 (다음 데이터 수집을 기다리지 않음)
  const file = await readJson('public/data/whiskies.json', null);
  if (file?.whiskies) await writeFile('public/data/whiskies.json', JSON.stringify({ ...file, whiskies: attachImages(file.whiskies.map(({ image, ...w }) => w), db) }));
  const total = Object.keys(db.images).length;
  console.log(`사진: 이번에 ${found}장 추가, 전체 ${total}/${seed.length}종, 이름 검색 ${searched}회, 실패 ${failed}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
