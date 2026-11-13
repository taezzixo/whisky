// 공통 HTTP — 재시도 3회 + 지수 대기 (기본 구성도 "안전장치")
const UA = 'whisky-dex-collector/0.1 (+https://github.com/)';

export async function getJson(url, { headers = {}, tries = 3, timeoutMs = 60000 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 120)}`);
      return await res.json();
    } catch (e) {
      last = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 1500 * 2 ** i));
    }
  }
  throw last;
}
