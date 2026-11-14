// 공통 HTTP — 재시도 3회 + 지수 대기 (기본 구성도 "안전장치")
// 위키미디어 등은 자동 수집기에 연락처(URL·이메일)가 든 User-Agent를 요구한다. 넣을지는 사용자가 정한다:
// GitHub 저장소 Settings → Variables 의 COLLECTOR_CONTACT (예: 사이트 주소). 없으면 일반 이름만 보낸다.
export const UA = `whisky-dex-collector/0.1${process.env.COLLECTOR_CONTACT ? ` (${process.env.COLLECTOR_CONTACT})` : ''}`;

async function request(url, { headers = {}, tries = 3, timeoutMs = 60000, baseDelayMs = 1500 } = {}, read) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 120)}`);
      return await read(res); // JSON 대신 점검 페이지(HTML)가 오면 여기서 실패 → 재시도
    } catch (e) {
      last = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
    }
  }
  throw last;
}

export const getJson = (url, opts) => request(url, opts, (res) => res.json());
export const getBuffer = (url, opts) => request(url, { ...opts, headers: { Accept: '*/*', ...opts?.headers } }, async (res) => Buffer.from(await res.arrayBuffer()));
