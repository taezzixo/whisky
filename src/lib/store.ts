// 사용자 데이터 — 브라우저 localStorage 에만 저장한다. 서버로 보내지 않는다.
// 기기 이동은 JSON 내보내기·가져오기로 한다.

import type { BtiProfile } from './bti.ts';
import type { CabinetItem, Tasting } from './collection.ts';

export const STORE_KEY = 'whisky-dex:v1';

export interface UserData {
  version: 1;
  bti?: BtiProfile & { at: string };
  wishlist: string[]; // 위스키 id
  tried: string[]; // 마셔본 위스키 id (별점 없이 표시만 한 것)
  tastings: Tasting[]; // 시음 기록 (별점·메모)
  cabinet: CabinetItem[]; // 나만의 가상 바 (보유 바틀)
  compare: string[]; // 비교함 (최대 4종)
}

export const emptyData = (): UserData => ({ version: 1, wishlist: [], tried: [], tastings: [], cabinet: [], compare: [] });

export function parseUserData(raw: unknown): UserData {
  if (!raw || typeof raw !== 'object') return emptyData();
  const r = raw as Partial<UserData>;
  const ids = (x: unknown) => (Array.isArray(x) ? [...new Set(x.filter((v): v is string => typeof v === 'string'))] : []);
  const tastings = Array.isArray(r.tastings)
    ? r.tastings.filter(
        (t): t is Tasting =>
          !!t && typeof t.id === 'string' && typeof t.whiskyId === 'string' && typeof t.rating === 'number' && t.rating >= 0.5 && t.rating <= 5 && /^\d{4}-\d{2}-\d{2}$/.test(t.date),
      )
    : [];
  const cabinet = Array.isArray(r.cabinet)
    ? r.cabinet.filter(
        (c): c is CabinetItem =>
          !!c && typeof c.id === 'string' && typeof c.whiskyId === 'string' && ['sealed', 'open', 'empty'].includes(c.state) && typeof c.fill === 'number' && c.fill >= 0 && c.fill <= 100,
      )
    : [];
  return { version: 1, bti: r.bti && Array.isArray(r.bti.taste) ? r.bti : undefined, wishlist: ids(r.wishlist), tried: ids(r.tried), tastings, cabinet, compare: ids(r.compare).slice(0, 4) };
}

export function loadUserData(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): UserData {
  try {
    const s = storage?.getItem(STORE_KEY);
    return s ? parseUserData(JSON.parse(s)) : emptyData();
  } catch {
    return emptyData();
  }
}

export function saveUserData(d: UserData, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(STORE_KEY, JSON.stringify(d));
  } catch {
    /* 사생활 보호 모드 등 저장 불가 — 화면은 계속 동작 */
  }
}

export function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** 가져오기: 기존 데이터와 합친다 (덮어쓰지 않음) */
export function mergeUserData(a: UserData, b: UserData): UserData {
  return {
    version: 1,
    bti: b.bti && (!a.bti || b.bti.at > a.bti.at) ? b.bti : a.bti,
    wishlist: [...new Set([...a.wishlist, ...b.wishlist])],
    tried: [...new Set([...a.tried, ...b.tried])],
    tastings: [...new Map([...a.tastings, ...b.tastings].map((t) => [t.id, t])).values()],
    cabinet: [...new Map([...a.cabinet, ...b.cabinet].map((c) => [c.id, c])).values()],
    compare: [...new Set([...a.compare, ...b.compare])].slice(0, 4),
  };
}

/** 시음 기록 추가·수정 (id가 같으면 덮어씀) */
export function upsertTasting(d: UserData, t: Tasting): UserData {
  return { ...d, tastings: [...d.tastings.filter((x) => x.id !== t.id), t] };
}

export function removeTasting(d: UserData, id: string): UserData {
  return { ...d, tastings: d.tastings.filter((x) => x.id !== id) };
}

/** 가상 바 병 추가·수정 */
export function upsertBottle(d: UserData, c: CabinetItem): UserData {
  return { ...d, cabinet: [...d.cabinet.filter((x) => x.id !== c.id), c] };
}

export function removeBottle(d: UserData, id: string): UserData {
  return { ...d, cabinet: d.cabinet.filter((x) => x.id !== id) };
}

/** 비교함: 최대 4종, 있으면 빼고 없으면 넣는다 */
export function toggleCompare(d: UserData, id: string): UserData {
  if (d.compare.includes(id)) return { ...d, compare: d.compare.filter((x) => x !== id) };
  return d.compare.length >= 4 ? d : { ...d, compare: [...d.compare, id] };
}
