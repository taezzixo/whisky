#!/usr/bin/env node
// SEO: 빌드 후 도감 위스키별 정적 페이지(dist/w/<id>.html), 목록(dist/w/index.html), sitemap.xml, robots.txt 생성.
// 각 페이지는 앱의 /?w=<id> 로 연결된다. 맛 정보가 없는 카탈로그 항목은 만들지 않는다(얇은 페이지 방지).
// SITE_URL(예: https://whisky-dex.xxx.workers.dev)이 있으면 canonical·sitemap에 절대 주소를 쓴다.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const DIST = 'dist';
const SITE = (process.env.SITE_URL ?? '').replace(/\/$/, '');
const AXES = ['단맛', '스모키·피트', '바디', '스파이시', '과일', '꽃·허브', '몰티·곡물', '오크·바닐라', '견과·초콜릿', '셰리·와인'];
const TYPE = { 'single-malt': '싱글몰트', 'blended-malt': '블렌디드 몰트', blended: '블렌디드', grain: '그레인', bourbon: '버번', tennessee: '테네시', rye: '라이', 'pot-still': '싱글 팟 스틸', other: '기타' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fileId = (id) => id.replace(/[^A-Za-z0-9_-]/g, '_');

function applyOverrides(items, ov) {
  if (!ov) return items;
  const hide = new Set(ov.hide ?? []);
  const out = items.filter((w) => !hide.has(w.id)).map((w) => (ov.patch?.[w.id] ? { ...w, ...ov.patch[w.id] } : w));
  const ids = new Set(out.map((w) => w.id));
  for (const m of ov.manual ?? []) if (m?.id && m.name && !ids.has(m.id) && !hide.has(m.id)) out.push({ grade: 'C', ...m, manual: true });
  return out;
}

export function whiskyPage(w, { site, generatedAt }) {
  const name = w.nameKo ?? w.name;
  const spec = [w.country, w.region, TYPE[w.type], w.age ? `${w.age}년` : 'NAS', w.abv ? `${w.abv}%` : ''].filter(Boolean).join(' · ');
  const desc = `${name} (${w.name}) — ${spec}. ${(w.tags ?? []).map((t) => `#${t}`).join(' ')} ${w.summary ?? ''} 맛 프로필과 비슷한 위스키 추천을 확인하세요.`.replace(/\s+/g, ' ').trim();
  const url = `${site}/w/${fileId(w.id)}`;
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: w.name, alternateName: w.nameKo, brand: w.brand ? { '@type': 'Brand', name: w.brand } : undefined, description: desc, category: TYPE[w.type] };
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)} 맛·비슷한 위스키 | 위스키 도감</title>
<meta name="description" content="${esc(desc)}">
${site ? `<link rel="canonical" href="${esc(url)}">` : ''}
<meta property="og:title" content="${esc(name)} 맛 프로필">
<meta property="og:description" content="${esc(desc)}">
<style>body{font:15px/1.6 system-ui,sans-serif;max-width:720px;margin:0 auto;padding:24px 16px;color:#1d1813;background:#fcfcfb}table{border-collapse:collapse}th,td{padding:4px 12px 4px 0;text-align:left}.muted{color:#7a7064;font-size:.85rem}@media(prefers-color-scheme:dark){body{background:#1a1a19;color:#f0efec}a{color:#86b6ef}}</style>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head><body><main>
<p><a href="/w/">← 전체 위스키</a> · <a href="/">위스키BTI</a></p>
<h1>${esc(name)}</h1>
<p>${esc(w.name)} · ${esc(spec)}</p>
${w.summary ? `<p>${esc(w.summary)}</p>` : ''}
${w.tags ? `<p>${w.tags.map((t) => `#${esc(t)}`).join(' ')}</p>` : ''}
<p><a href="/?w=${encodeURIComponent(w.id)}"><b>맛 레이더와 비슷한 위스키 추천 보기 →</b></a></p>
${w.flavor ? `<h2>맛 프로필 (0~5, 추정)</h2><table>${w.flavor.map((v, i) => `<tr><th>${AXES[i]}</th><td>${v}</td></tr>`).join('')}</table>` : ''}
<p class="muted">만 19세 이상을 위한 정보입니다. 맛 수치·가격은 추정치(참고용)이며 판매 정보가 아닙니다. 갱신: ${esc(generatedAt.slice(0, 10))}</p>
</main></body></html>`;
}

async function main() {
  if (!existsSync(`${DIST}/data/whiskies.json`)) return console.log('prerender: dist/data/whiskies.json 없음 → 건너뜀');
  const file = JSON.parse(await readFile(`${DIST}/data/whiskies.json`, 'utf8'));
  const ov = existsSync(`${DIST}/data/overrides.json`) ? JSON.parse(await readFile(`${DIST}/data/overrides.json`, 'utf8')) : null;
  const items = applyOverrides(file.whiskies, ov).filter((w) => w.flavor);
  await mkdir(`${DIST}/w`, { recursive: true });
  for (const w of items) await writeFile(`${DIST}/w/${fileId(w.id)}.html`, whiskyPage(w, { site: SITE, generatedAt: file.generatedAt }));
  const list = items.map((w) => `<li><a href="/w/${fileId(w.id)}">${esc(w.nameKo ?? w.name)}</a> <span class="muted">${esc(w.name)}</span></li>`).join('');
  await writeFile(`${DIST}/w/index.html`, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>위스키 도감 전체 목록</title><meta name="description" content="위스키 ${items.length}종의 맛 프로필과 비슷한 위스키 추천."></head><body style="font:15px/1.7 system-ui,sans-serif;max-width:720px;margin:0 auto;padding:24px 16px"><h1>위스키 도감 (${items.length}종)</h1><p><a href="/">위스키BTI 하러 가기 →</a></p><ul>${list}</ul></body></html>`);
  const urls = ['/', '/w/', ...items.map((w) => `/w/${fileId(w.id)}`)];
  await writeFile(`${DIST}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${esc(SITE + u)}</loc><lastmod>${file.generatedAt.slice(0, 10)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  await writeFile(`${DIST}/robots.txt`, `User-agent: *\nAllow: /\n${SITE ? `Sitemap: ${SITE}/sitemap.xml\n` : ''}`);
  console.log(`prerender: 위스키 페이지 ${items.length}개 + sitemap`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
