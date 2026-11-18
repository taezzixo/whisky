#!/usr/bin/env node
// 고화질 병 사진 하루 일정량 수집 (2026-11-18 사용자 요청: 하루 10종, 깔끔한 단독 병, 반사·그을림 없는 선명한 사진).
//  1) 순서: 사용자 제공 캡처 → 배경 있는 사진 → 사진 없음 (scripts/lib/hq.mjs 의 hqQueue)
//  2) 위키미디어 공용에서 자유 라이선스(CC BY·BY-SA·CC0·PD) 원본만 찾는다. 쇼핑몰·리뷰 사이트 이미지는 쓰지 않는다.
//  3) scripts/hq/cutout.py(rembg isnet)로 배경을 지우고 품질 검사(hqQuality)를 통과한 것만 저장.
//  4) data/images.json 에 작성자·라이선스·원본 주소를 남기고(hq: true), public/data/whiskies.json 에도 바로 반영.
// 못 찾은 위스키는 images.json 의 hq.misses 에 날짜를 남기고 30일 뒤 다시 본다.
// 잘못 고른 사진은 images.json 의 hq.reject 에 위키미디어 파일 제목("File:…")을 넣으면 다시 고르지 않는다.
//
// 환경 변수: HQ_DAILY(하루 목표, 기본 10) · HQ_MAX_WHISKIES(한 번에 살펴볼 위스키 수, 기본 100)
//           HQ_ONLY(쉼표로 나눈 위스키 id — 이것만 처리, 순서·30일 대기 무시)
//           HQ_MINUTES(시간 예산, 기본 30) · HQ_PYTHON(파이썬, 기본 python3)
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getBuffer, getJson, UA } from './sources/http.mjs';
import { attachImages, imageFile, stripHtml } from './lib/images.mjs';
import { hqCandidates, hqDownloadUrl, hqQuality, hqQueries, hqQueue } from './lib/hq.mjs';

const DAILY = Number(process.env.HQ_DAILY ?? 10);
const MAX_WHISKIES = Number(process.env.HQ_MAX_WHISKIES ?? 100);
const DEADLINE = Date.now() + Number(process.env.HQ_MINUTES ?? 30) * 60_000;
const PYTHON = process.env.HQ_PYTHON ?? 'python3';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = async (p, d) => (existsSync(p) ? JSON.parse(await readFile(p, 'utf8')) : d);
const today = () => new Date().toISOString().slice(0, 10);

/** 파이썬 배경 제거 프로세스: 모델을 한 번만 올리고 한 줄씩 주고받는다 */
function startCutter() {
  const py = spawn(PYTHON, ['-I', 'scripts/hq/cutout.py'], { stdio: ['pipe', 'pipe', 'inherit'] });
  const lines = createInterface({ input: py.stdout });
  const waiting = [];
  lines.on('line', (l) => {
    if (!l.startsWith('{')) return console.error(`[hq:py] ${l}`); // 결과 줄이 아닌 출력은 무시
    waiting.shift()?.(JSON.parse(l));
  });
  py.on('exit', (code) => { while (waiting.length) waiting.shift()({ ok: false, error: `파이썬 종료 ${code}` }); });
  return {
    cut: (src, out) => new Promise((res) => { waiting.push(res); py.stdin.write(`${JSON.stringify({ src, out })}\n`); }),
    close: () => py.stdin.end(),
  };
}

async function search(q) {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=20' +
    `&gsrsearch=${encodeURIComponent(q)}&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiextmetadatafilter=LicenseShortName|Artist`;
  // 위키미디어는 몰아서 부르면 429 → 3초 간격, 429면 20·40초 기다렸다 다시
  const r = await getJson(api, { tries: 3, baseDelayMs: 20000, headers: { 'User-Agent': UA } });
  await sleep(3000);
  return Object.values(r?.query?.pages ?? {});
}

async function main() {
  const seed = (await readJson('data/flavor-seed.json', { whiskies: [] })).whiskies;
  const db = await readJson('data/images.json', { images: {}, misses: {} });
  db.hq ??= { misses: {}, reject: [] };
  db.hq.misses ??= {};
  db.hq.reject ??= [];
  const tmp = join(tmpdir(), 'whisky-hq');
  await mkdir(tmp, { recursive: true });
  await mkdir('public/img/w', { recursive: true });

  const only = (process.env.HQ_ONLY ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  const queue = only.length ? seed.filter((w) => only.includes(w.id)) : hqQueue(seed, db).slice(0, MAX_WHISKIES);
  const cutter = startCutter();
  const added = [];
  const skipped = [];
  let failures = 0;

  for (const w of queue) {
    if (added.length >= DAILY || Date.now() > DEADLINE) break;
    try {
      const seen = new Set();
      const cands = [];
      for (const q of hqQueries(w)) {
        for (const c of hqCandidates(w, await search(q), db.hq.reject)) {
          if (seen.has(c.title)) continue;
          seen.add(c.title);
          cands.push(c);
        }
        if (cands.length >= 3) break;
      }
      let done = false;
      let blocked = 0;
      const why = [];
      for (const c of cands.slice(0, 3)) {
        const src = join(tmp, `${w.id}.img`);
        let buf;
        try {
          buf = await getBuffer(hqDownloadUrl(c.ii), { tries: 3, baseDelayMs: 20000, timeoutMs: 60000, headers: { 'User-Agent': UA } });
        } catch (e) {
          blocked++; // 내려받기 실패(요청 제한 등)는 '못 찾음'이 아니다 → 다음 후보로, 다음 회차에 다시
          why.push(`${c.title}: ${e.message.slice(0, 40)}`);
          continue;
        } finally {
          await sleep(2000);
        }
        if (buf.length < 5000 || !(buf[0] === 0xff || buf[0] === 0x89)) { why.push(`${c.title}: 이미지 아님`); continue; }
        await writeFile(src, buf);
        const file = imageFile(w.id, 'webp');
        const out = join(tmp, `${w.id}.webp`);
        const m = await cutter.cut(src, out);
        const q = m.ok ? hqQuality(m) : { ok: false, why: [m.error] };
        if (!q.ok) { why.push(`${c.title}: ${q.why.join(', ')}`); continue; }
        await writeFile(`public/${file}`, await readFile(out));
        const old = db.images[w.id]?.file;
        const meta = c.ii.extmetadata ?? {};
        db.images[w.id] = {
          file,
          source: hqDownloadUrl(c.ii),
          product: c.ii.descriptionurl,
          credit: `${stripHtml(meta.Artist?.value) || '작성자 미상'}, 위키미디어 공용, 배경 제거`,
          license: meta.LicenseShortName?.value ?? '',
          cutout: true,
          hq: true,
          w: m.w,
          h: m.h,
          at: today(),
        };
        if (old && old !== file && !Object.values(db.images).some((x) => x.file === old)) await rm(`public/${old}`, { force: true });
        delete db.misses?.[w.id];
        delete db.hq.misses[w.id];
        added.push({ id: w.id, name: w.name, title: c.title, license: db.images[w.id].license, sheen: m.sheen, srcH: m.srcH });
        console.log(`[hq] + ${w.id} ← ${c.title} (병 ${m.srcH}px, 날아간 부분 ${m.glare}%, 반사 얼룩 ${m.sheen}%)`);
        done = true;
        break;
      }
      if (!done && blocked) {
        failures++;
        console.error(`[hq] ${w.id}: 후보 사진을 내려받지 못함 (${why.join(' / ')})`);
        if (failures >= 8) { console.error('[hq] 실패가 많아 이번 회차를 멈춥니다(요청 제한 가능성).'); break; }
      } else if (!done) {
        db.hq.misses[w.id] = today();
        skipped.push({ id: w.id, why: why.length ? why : ['조건에 맞는 자유 라이선스 사진 없음'] });
      }
    } catch (e) {
      failures++;
      console.error(`[hq] ${w.id}: ${e.message}`);
      if (failures >= 8) { console.error('[hq] 실패가 많아 이번 회차를 멈춥니다(요청 제한 가능성).'); break; }
    }
  }
  cutter.close();

  await writeFile('data/images.json', JSON.stringify(db, null, 1));
  const file = await readJson('public/data/whiskies.json', null);
  if (file?.whiskies) await writeFile('public/data/whiskies.json', JSON.stringify({ ...file, whiskies: attachImages(file.whiskies.map(({ image, ...w }) => w), db) }));

  const hqTotal = Object.values(db.images).filter((x) => x.hq).length;
  const summary = [
    `## 고화질 병 사진 ${today()}`,
    `이번에 ${added.length}종 추가 (목표 ${DAILY}), 고화질 누적 ${hqTotal}/${seed.length}종, 못 찾음 ${skipped.length}, 오류 ${failures}`,
    '',
    ...added.map((a) => `- 추가: ${a.name} ← ${a.title} (${a.license}, 병 ${a.srcH}px, 반사 얼룩 ${a.sheen}%)`),
    ...skipped.map((s) => `- 건너뜀: ${s.id}: ${s.why.slice(0, 2).join(' / ')}`),
  ].join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, { flag: 'a' });
  if (process.env.GITHUB_OUTPUT) await writeFile(process.env.GITHUB_OUTPUT, `added=${added.length}\n`, { flag: 'a' });
}

main().catch((e) => { console.error(e); process.exit(1); });
