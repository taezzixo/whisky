// 실제 위스키 사진 — Open Food Facts 제품 사진(CC BY-SA 3.0, 사용자 기여)만 쓴다. 쇼핑몰 이미지는 쓰지 않는다.
// 순수 함수만 둔다(테스트 대상).
import { normName } from './normalize.mjs';

export const IMAGE_LICENSE = 'CC BY-SA 3.0';
export const IMAGE_CREDIT = 'Open Food Facts 기여자';

const firstToken = (s = '') => normName(s).split(' ').find((t) => t.length >= 3) ?? '';

/**
 * 사진의 제품이 시드 위스키와 같은지 보수적으로 판단한다(잘못된 사진보다 사진 없음이 낫다).
 * - 브랜드(또는 이름 첫 단어)가 제품명·브랜드에 들어 있어야 한다
 * - 시드에 숙성 연수가 있으면 제품명에도 같은 숫자가 있어야 하고, 다른 연수가 적혀 있으면 안 된다
 */
export function imageMatches(w, product) {
  const hay = ` ${normName(`${product.product_name ?? ''} ${product.brands ?? ''}`)} `;
  const brand = firstToken(w.brand ?? w.name);
  if (!brand || !hay.includes(brand)) return false;
  const ages = [...hay.matchAll(/ (\d{1,2}) /g)].map((m) => Number(m[1])).filter((n) => n >= 3 && n <= 50);
  if (w.age) return ages.includes(w.age) && ages.every((a) => a === w.age);
  return ages.length === 0 || /nas|no age/.test(hay);
}

/** 제품 JSON에서 앞면 사진 400px 주소 */
export function frontImageUrl(product) {
  const sel = product.selected_images?.front?.display;
  return product.image_front_url || sel?.en || sel?.fr || (sel && Object.values(sel)[0]) || null;
}

export const imageFile = (id, ext = 'jpg') => `img/w/${id.replace(/^seed-/, '')}.${ext}`;

/** 위키미디어 공용 파일 제목 → 비교용 문구 ("File:GlenfiddichSpecialReserve12Years.jpg" → "Glenfiddich Special Reserve 12 Years") */
export function commonsTitleText(title = '') {
  return String(title)
    .replace(/^File:/i, '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2');
}

/** 자유 이용 가능한 라이선스만 (CC BY, CC BY-SA, CC0, 퍼블릭 도메인) */
export function freeLicense(name = '') {
  const n = String(name).toLowerCase();
  if (/nc|nd|fair use|non-free/.test(n)) return false;
  return /^cc[ -]by|^cc0|public domain|^pd/.test(n);
}

/** 위키미디어 공용 검색 결과에서 가장 알맞은 사진 1장 (세로로 긴 병 사진 우선) */
export function pickCommons(w, pages = []) {
  const cand = pages
    .map((p) => ({ p, ii: p.imageinfo?.[0] }))
    .filter(({ p, ii }) => ii && /^image\/(jpeg|png|webp)$/.test(ii.mime) && freeLicense(ii.extmetadata?.LicenseShortName?.value) && imageMatches(w, { product_name: commonsTitleText(p.title), brands: '' }))
    .sort((a, b) => b.ii.height / b.ii.width - a.ii.height / a.ii.width);
  return cand[0] ?? null;
}

export const stripHtml = (s = '') => String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** 사진 정보를 도감 위스키에 붙인다 (data/images.json → whiskies.json) */
export function attachImages(whiskies, db) {
  return whiskies.map((w) => {
    const im = db?.images?.[w.id];
    return im ? { ...w, image: { src: im.file, credit: im.credit, license: im.license, url: im.product } } : w;
  });
}
