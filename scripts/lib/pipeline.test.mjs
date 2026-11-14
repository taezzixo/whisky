import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isZip, parseJsonRows, readFirstZipEntry } from './zip.mjs';
import { cleanIowaName } from './normalize.mjs';
import { attachDistilleries, guessType, isSuspiciousEmpty, mergeCatalog, normName, parseAge, parseIowa, parseOff, parseWikidata } from './normalize.mjs';

const fx = (f) => JSON.parse(readFileSync(new URL(`../fixtures/${f}`, import.meta.url), 'utf8'));
const seed = JSON.parse(readFileSync(new URL('../../data/flavor-seed.json', import.meta.url), 'utf8')).whiskies;

test('normName: 표기 차이를 흡수', () => {
  assert.equal(normName('The Glenlivet 12 Year Old'), normName('Glenlivet 12'));
  assert.equal(normName("Maker's Mark"), 'maker s mark');
});

test('parseAge', () => {
  assert.equal(parseAge('LAPHROAIG 10YR'), 10);
  assert.equal(parseAge('Glenfiddich 12 Year Old'), 12);
  assert.equal(parseAge('Monkey Shoulder'), null);
});

test('guessType', () => {
  assert.equal(guessType('Jack Daniels Tennessee Whiskey'), 'tennessee');
  assert.equal(guessType('STRAIGHT BOURBON WHISKIES'), 'bourbon');
  assert.equal(guessType('SINGLE MALT SCOTCH'), 'single-malt');
});

test('parseOff: 바코드 없는 항목 제외, 고정 id', () => {
  const r = parseOff(fx('off-search.json').products);
  assert.equal(r.length, 2);
  assert.equal(r[0].id, 'off-5010327325125');
  assert.equal(r[0].abv, 40);
  assert.equal(r[0].country, '스코틀랜드');
  assert.equal(r[1].abv, 40); // nutriments 에서 읽음
  assert.equal(parseOff([{ code: '12345678', product_name: 'Test Whisky 43% vol' }])[0].abv, 43); // 이름 표기에서 읽음
});

test('parseIowa: 위스키만(리큐어 제외), 같은 제품은 750ml 하나', () => {
  const r = parseIowa(fx('iowa-products.json'));
  assert.equal(r.length, 2);
  const bt = r.find((w) => w.name === 'Buffalo Trace');
  assert.equal(bt.id, 'ia-26827');
  assert.equal(bt.abv, 45);
  assert.deepEqual(bt.barcode, ['080244009236']);
  assert.equal(r.find((w) => /Laphroaig/.test(w.name)).country, '스코틀랜드');
});

test('parseWikidata: 중복·라벨 없는 항목 제외, 좌표 파싱', () => {
  const r = parseWikidata(fx('wikidata.json'));
  assert.equal(r.length, 1);
  assert.equal(r[0].id, 'wd-Q1531370');
  assert.equal(r[0].lat, 55.6302);
  assert.equal(r[0].lng, -6.1517);
});

test('attachDistilleries: 시드에 증류소 좌표 연결', () => {
  const out = attachDistilleries(seed, parseWikidata(fx('wikidata.json')));
  const l = out.find((w) => w.id === 'seed-laphroaig-10');
  assert.equal(l.lat, 55.6302);
});

test('mergeCatalog: 시드와 같은 제품은 바코드만 붙이고 카탈로그에서 제외', () => {
  const cat = [...parseOff(fx('off-search.json').products), ...parseIowa(fx('iowa-products.json'))];
  const { seed: s, catalog } = mergeCatalog(seed, cat);
  assert.deepEqual(s.find((w) => w.id === 'seed-glenfiddich-12').barcode, ['5010327325125']);
  assert.deepEqual(s.find((w) => w.id === 'seed-buffalo-trace').barcode, ['080244009236']);
  assert.ok(!catalog.some((w) => w.id === 'off-5010327325125'));
  assert.equal(s.length, seed.length);
});

test('0건 가드', () => {
  assert.equal(isSuspiciousEmpty(0, 120), true);
  assert.equal(isSuspiciousEmpty(0, 0), false);
  assert.equal(isSuspiciousEmpty(3, 120), false);
});

test('시드: id 고정 형식, 맛 벡터 10축 0~5', () => {
  for (const w of seed) {
    assert.match(w.id, /^seed-[a-z0-9-]+$/);
    assert.equal(w.flavor.length, 10);
    assert.ok(w.flavor.every((v) => v >= 0 && v <= 5), w.id);
  }
});

test('zip: 저장·deflate 방식 모두 풀고 줄 단위 JSON을 읽는다', () => {
  for (const f of ['iowa-stored.zip', 'iowa-deflate.zip']) {
    const buf = readFileSync(new URL(`../fixtures/${f}`, import.meta.url));
    assert.ok(isZip(buf), f);
    const rows = parseJsonRows(readFirstZipEntry(buf).toString('utf8'));
    assert.equal(rows.length, 5, f);
    assert.equal(parseIowa(rows).length, 2, f);
  }
  assert.equal(parseJsonRows('[{"a":1}]')[0].a, 1);
  assert.equal(isZip(Buffer.from('[]')), false);
});

test('Iowa 이름 정리: 판매처 코드 제거, 미니어처·선물세트 제외', () => {
  assert.equal(cleanIowaName('Tomintoul 16 Year Single Malt Scotch Use Code 963327'), 'Tomintoul 16 Year Single Malt Scotch');
  assert.equal(cleanIowaName('Bp 1792 Bib Bourbon Ksbw'), '1792 Bottled in Bond Bourbon Kentucky Straight Bourbon Whiskey');
  assert.equal(cleanIowaName('Sooh Cm Knappogue Castle 12yr'), 'Knappogue Castle 12 Year');
  assert.equal(cleanIowaName('Habit Rye'), 'Habit Rye'); // 단어 일부는 건드리지 않음
  assert.equal(cleanIowaName('Rclr Straight Rye Whiskey'), 'Rclr Straight Rye Whiskey');
  const r = parseIowa([
    { item_no: '1', category_name: 'Straight Bourbon Whiskies', im_desc: 'Bulleit Bourbon W/Mini Flask', bottle_volume_ml: 750, proof: 80 },
    { item_no: '2', category_name: 'Tennessee Whiskies', im_desc: 'Jack Daniels Honey Mini', bottle_volume_ml: 50, proof: 70 },
    { item_no: '3', category_name: 'Single Malt Scotch', im_desc: 'Tomintoul 16 Year Use Code 963327', bottle_volume_ml: 750, proof: 80 },
    { item_no: '4', category_name: 'Straight Bourbon Whiskies', im_desc: 'Makers Mark Generations Tri-Pack', bottle_volume_ml: 750, proof: 90 },
    { item_no: '5', category_name: 'Straight Bourbon Whiskies', im_desc: 'Clyde Mays Dualpack', bottle_volume_ml: 750, proof: 90 },
  ]);
  assert.deepEqual(r.map((w) => w.name), ['Tomintoul 16 Year']);
});

test('시드 점검 규칙 (docs/SEED_GUIDE.md §2)', () => {
  const bad = [];
  for (const w of seed) {
    const [, smoky, , spicy, , , , oaky, , winey] = w.flavor;
    const wineCask = w.casks?.some((c) => ['sherry', 'wine', 'port'].includes(c));
    if (!wineCask && winey > 1) bad.push(`${w.id}: 셰리·와인 통 없는데 셰리 축 ${winey}`);
    if (w.peated === false && smoky > 1) bad.push(`${w.id}: 피트 없는데 스모키 ${smoky}`);
    if (w.peated === true && smoky < 1) bad.push(`${w.id}: 피트인데 스모키 ${smoky}`);
    if (w.country === '미국' && ['bourbon', 'rye', 'tennessee'].includes(w.type) && oaky < 3) bad.push(`${w.id}: 버번·라이인데 오크 ${oaky}`);
    if (w.type === 'rye' && spicy < 4) bad.push(`${w.id}: 라이인데 스파이시 ${spicy}`);
  }
  assert.deepEqual(bad, []);
});
