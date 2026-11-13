import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
});

test('parseIowa: 위스키만, 같은 제품은 750ml 하나', () => {
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
