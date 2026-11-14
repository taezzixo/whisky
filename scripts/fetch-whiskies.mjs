#!/usr/bin/env node
// 위스키 데이터 수집 메인 (GitHub Actions 주 1회).
// 시드(data/flavor-seed.json) + Wikidata 증류소 좌표 + Open Food Facts·Iowa 카탈로그
//   → public/data/whiskies.json (맛 정보 있는 도감) · catalog.json (검색용 카탈로그)
//   · distilleries.json · run-log.json
// 출처 하나가 실패하거나 갑자기 0건이면 그 출처는 직전 데이터를 유지한다.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { attachDistilleries, isSuspiciousEmpty, mergeCatalog, quality } from './lib/normalize.mjs';
import { fetchWikidata } from './sources/wikidata.mjs';
import { fetchOff } from './sources/openfoodfacts.mjs';
import { fetchIowa } from './sources/iowa.mjs';

const OUT = 'public/data';
const CACHE = 'data/source-cache'; // 출처별 원본 결과(배포 안 함). 출처가 실패하면 이 값으로 대신한다
const readJson = async (p, fallback) => (existsSync(p) ? JSON.parse(await readFile(p, 'utf8')) : fallback);

async function main() {
  const started = Date.now();
  const seed = (await readJson('data/flavor-seed.json', { whiskies: [] })).whiskies;
  const prevCatalog = (await readJson(`${OUT}/catalog.json`, { items: [] })).items;
  const prevDist = (await readJson(`${OUT}/distilleries.json`, { items: [] })).items;
  const prevLog = await readJson(`${OUT}/run-log.json`, { history: [] });
  const prevCount = Object.fromEntries((prevLog.last?.sources ?? []).map((s) => [s.id, s.count]));

  const sources = [];
  await mkdir(CACHE, { recursive: true });
  async function run(id, fn, prevItems) {
    const t = Date.now();
    try {
      const items = await fn();
      if (isSuspiciousEmpty(items.length, prevCount[id])) throw new Error(`0건 (직전 ${prevCount[id]}건) — 직전 데이터 유지`);
      await writeFile(`${CACHE}/${id}.json`, JSON.stringify(items));
      sources.push({ id, ok: true, count: items.length, sec: Math.round((Date.now() - t) / 1000) });
      return items;
    } catch (e) {
      // 직전 원본 캐시가 있으면 그대로 쓰고(시드에 붙은 바코드까지 유지), 없으면 직전 카탈로그에서 그 출처 항목만 쓴다
      const cached = await readJson(`${CACHE}/${id}.json`, null);
      const fallback = Array.isArray(cached) ? cached : prevItems;
      console.error(`[${id}] 실패: ${e.message} → 직전 데이터 ${fallback.length}건 유지`);
      sources.push({ id, ok: false, count: fallback.length, error: String(e.message).slice(0, 200), sec: Math.round((Date.now() - t) / 1000) });
      return fallback;
    }
  }

  const distilleries = await run('wikidata', fetchWikidata, prevDist);
  const off = await run('off', fetchOff, prevCatalog.filter((w) => w.source === 'off'));
  const iowa = await run('iowa', fetchIowa, prevCatalog.filter((w) => w.source === 'iowa'));

  const merged = mergeCatalog(attachDistilleries(seed, distilleries), [...off, ...iowa]);
  const generatedAt = new Date().toISOString();
  const allOk = sources.every((s) => s.ok);

  await writeFile(`${OUT}/whiskies.json`, JSON.stringify({ generatedAt, sample: false, sources: [{ id: 'seed', ok: true, count: seed.length }, ...sources.map(({ sec, ...s }) => s)], whiskies: merged.seed }));
  await writeFile(`${OUT}/catalog.json`, JSON.stringify({ generatedAt, items: merged.catalog }));
  await writeFile(`${OUT}/distilleries.json`, JSON.stringify({ generatedAt, items: distilleries }));
  const last = {
    runAt: generatedAt,
    durationSec: Math.round((Date.now() - started) / 1000),
    sources,
    quality: { dex: quality(merged.seed), catalog: quality(merged.catalog) },
  };
  await writeFile(`${OUT}/run-log.json`, JSON.stringify({ last, history: [last, ...(prevLog.history ?? [])].slice(0, 30) }, null, 1));
  console.log(`도감 ${merged.seed.length}종 · 카탈로그 ${merged.catalog.length}건 · 증류소 ${distilleries.length}곳 · ${allOk ? '모든 출처 성공' : '일부 출처 실패(직전 데이터 유지)'}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
