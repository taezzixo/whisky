// 수집 정규화 — 순수 함수만 둔다 (네트워크 없음, 테스트 대상).
// 출처별 원본 → 공통 Whisky 형식 (src/types.ts). id 는 출처 접두어로 고정한다.

/** 이름 비교용 정규화: 소문자, 악센트·기호 제거, 흔한 표기 통일 */
export function normName(s = '') {
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(the|whisky|whiskey|scotch|single malt|kentucky straight|bourbon|yo|year old|years old|years|year|yr)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** 이름에서 숙성 연수 추출 (없으면 null) */
export function parseAge(s = '') {
  const m = String(s).match(/(\d{1,2})\s*(?:yo|y\.?o\.?|years?|yr|년)\b/i) ?? String(s).match(/\b(\d{1,2})\b(?=\s*$)/);
  const n = m ? Number(m[1]) : NaN;
  return n >= 3 && n <= 60 ? n : null;
}

/** 이름·카테고리 문자열로 종류 추정 */
export function guessType(text = '') {
  const t = String(text).toLowerCase();
  if (/tennessee/.test(t)) return 'tennessee';
  if (/\brye\b/.test(t)) return 'rye';
  if (/bourbon/.test(t)) return 'bourbon';
  if (/blended malt|vatted/.test(t)) return 'blended-malt';
  if (/single malt|single-malt/.test(t)) return 'single-malt';
  if (/single pot still|pot still/.test(t)) return 'pot-still';
  if (/grain/.test(t)) return 'grain';
  if (/blend/.test(t)) return 'blended';
  return 'other';
}

const COUNTRY_KO = {
  'united kingdom': '스코틀랜드', scotland: '스코틀랜드', 'united states': '미국', 'united states of america': '미국', usa: '미국',
  ireland: '아일랜드', japan: '일본', taiwan: '대만', india: '인도', australia: '호주', canada: '캐나다', france: '프랑스',
  germany: '독일', 'south korea': '한국', korea: '한국', wales: '웨일스', england: '잉글랜드', sweden: '스웨덴',
};
export function countryKo(name = '') {
  const k = String(name).toLowerCase().replace(/^en:/, '').replace(/-/g, ' ').trim();
  return COUNTRY_KO[k] ?? (name ? String(name) : '');
}

const num = (v) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

// ── Open Food Facts ─────────────────────────────────────────────
// https://world.openfoodfacts.org/api/v2/search?categories_tags_en=whiskies (ODbL, 출처 표기 필요)
export function parseOff(products = []) {
  const out = [];
  for (const p of products) {
    const code = String(p.code ?? '').replace(/\D/g, '');
    const name = String(p.product_name_en || p.product_name || '').trim();
    if (!code || code.length < 8 || !name) continue;
    const abv = num(p.alcohol_value) ?? num(p.nutriments?.alcohol_100g) ?? num(p.nutriments?.alcohol) ?? num(String(name).match(/(\d{2}(?:[.,]\d{1,2})?)\s*%/)?.[1]);
    const brand = String(p.brands ?? '').split(',')[0].trim() || undefined;
    const country = countryKo(String(p.countries_tags?.[0] ?? p.origins ?? ''));
    out.push({
      id: `off-${code}`,
      source: 'off',
      name,
      brand,
      country: country || '',
      type: guessType(`${name} ${(p.categories_tags ?? []).join(' ')}`),
      age: parseAge(name),
      abv: abv && abv > 20 && abv < 80 ? abv : undefined,
      barcode: [code],
      grade: 'C',
      refs: [{ source: 'off', url: `https://world.openfoodfacts.org/product/${code}` }],
    });
  }
  return out;
}

// ── Iowa Liquor Products (data.iowa.gov, Socrata) ───────────────
// 열 이름이 바뀔 수 있어 후보를 여러 개 본다.
const pick = (o, keys) => keys.map((k) => o[k]).find((v) => v != null && v !== '');
export function parseIowa(rows = []) {
  const seen = new Map();
  for (const r of rows) {
    const cat = String(pick(r, ['category_name', 'categoryname', 'category']) ?? '');
    if (!/whisk|bourbon|scotch|\brye\b/i.test(cat) || /liqueur|cordial/i.test(cat)) continue; // 위스키 리큐어는 위스키가 아님
    const item = String(pick(r, ['item_no', 'itemno', 'item_number']) ?? '').trim();
    const desc = String(pick(r, ['im_desc', 'item_description', 'description']) ?? '').trim();
    if (!item || !desc) continue;
    const vol = num(pick(r, ['bottle_volume_ml', 'bottle_size']));
    // 미니어처(375ml 미만)·선물세트(잔·미니 동봉)는 도감 단위가 아니라 뺀다
    if ((vol && vol < 375) || /\bw\/|\bmini\b|gift|\bvap\b|glass(es)?\b/i.test(desc)) continue;
    const key = normName(cleanIowaName(desc));
    const prev = seen.get(key);
    if (prev && prev.vol === 750) continue; // 같은 제품은 750ml 우선
    const proof = num(pick(r, ['proof']));
    const upc = String(pick(r, ['upc']) ?? '').replace(/\D/g, '');
    seen.set(key, {
      vol,
      w: {
        id: `ia-${item}`,
        source: 'iowa',
        name: titleCase(cleanIowaName(desc)),
        brand: undefined,
        country: /scotch/i.test(cat) ? '스코틀랜드' : /irish/i.test(cat) ? '아일랜드' : /canadian/i.test(cat) ? '캐나다' : /japan/i.test(cat) ? '일본' : /imported|world/i.test(cat) ? '' : '미국',
        type: guessType(`${desc} ${cat}`),
        age: parseAge(desc),
        abv: proof ? Math.round((proof / 2) * 10) / 10 : undefined,
        barcode: upc.length >= 8 ? [upc] : undefined,
        grade: 'C',
        refs: [{ source: 'iowa', url: 'https://data.iowa.gov/catalog/dataset/1029' }],
      },
    });
  }
  return [...seen.values()].map((x) => x.w);
}

/** 판매처 내부 표기 제거: "Use Code 963327" 등 */
export function cleanIowaName(s) {
  return String(s).replace(/\s*use code \d+/gi, '').replace(/\s{2,}/g, ' ').trim();
}

function titleCase(s) {
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\bYr\b/g, 'Year');
}

// ── Wikidata (SPARQL, CC0) — 위스키 증류소와 좌표 ───────────────
export function parseWikidata(json) {
  const rows = json?.results?.bindings ?? [];
  const byId = new Map();
  for (const b of rows) {
    const qid = b.d?.value?.split('/').pop();
    const name = b.dLabel?.value;
    if (!qid || !name || /^Q\d+$/.test(name)) continue;
    const m = b.coord?.value?.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
    if (byId.has(qid)) continue;
    byId.set(qid, {
      id: `wd-${qid}`,
      name,
      nameKo: b.dLabelKo?.value,
      country: countryKo(b.countryLabel?.value ?? ''),
      lat: m ? Number(m[2]) : undefined,
      lng: m ? Number(m[1]) : undefined,
      url: `https://www.wikidata.org/wiki/${qid}`,
    });
  }
  return [...byId.values()];
}

// ── 병합 ────────────────────────────────────────────────────────
/** 시드 위스키에 증류소 좌표를 붙인다 */
export function attachDistilleries(whiskies, distilleries) {
  const idx = new Map(distilleries.map((d) => [normName(d.name).replace(/ distillery$/, ''), d]));
  return whiskies.map((w) => {
    if (!w.distillery || w.lat != null) return w;
    const d = idx.get(normName(w.distillery));
    return d?.lat != null ? { ...w, lat: d.lat, lng: d.lng, refs: [...(w.refs ?? []), { source: 'wikidata', url: d.url }] } : w;
  });
}

/**
 * 수집 카탈로그를 시드와 합친다.
 * - 시드와 같은 제품(이름 일치 + 숙성 일치)이면 바코드만 시드에 붙이고 카탈로그에서는 뺀다.
 * - 카탈로그끼리는 바코드 → 정규화 이름 순으로 중복 제거.
 */
export function mergeCatalog(seed, catalog) {
  const seedKey = new Map(seed.map((w) => [`${normName(w.name)}|${w.age ?? ''}`, w]));
  const seedOut = new Map(seed.map((w) => [w.id, { ...w }]));
  const seenBarcode = new Set(seed.flatMap((w) => w.barcode ?? []));
  const seenName = new Set();
  const rest = [];
  for (const c of catalog) {
    const k = `${normName(c.name)}|${c.age ?? ''}`;
    const s = seedKey.get(k);
    if (s) {
      const t = seedOut.get(s.id);
      t.barcode = [...new Set([...(t.barcode ?? []), ...(c.barcode ?? [])])];
      if (!t.barcode.length) delete t.barcode;
      t.refs = [...(t.refs ?? []), ...(c.refs ?? [])];
      continue;
    }
    if (c.barcode?.some((b) => seenBarcode.has(b))) continue;
    if (seenName.has(k)) continue;
    c.barcode?.forEach((b) => seenBarcode.add(b));
    seenName.add(k);
    rest.push(c);
  }
  return { seed: [...seedOut.values()], catalog: rest };
}

/** 출처가 갑자기 0건이면 일시 장애로 본다 (기본 구성도 D-4) */
export function isSuspiciousEmpty(count, prevCount) {
  return count === 0 && (prevCount ?? 0) >= 5;
}

/** 정합성 점검 — 관리·인계용 품질 요약 */
export function quality(items) {
  const q = { total: items.length, noFlavor: 0, noAbv: 0, noCountry: 0, gradeC: 0 };
  for (const w of items) {
    if (!w.flavor) q.noFlavor++;
    if (!w.abv) q.noAbv++;
    if (!w.country) q.noCountry++;
    if (w.grade === 'C') q.gradeC++;
  }
  return q;
}
