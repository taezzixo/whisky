// 화면 테마(라이트·다크). 고른 값은 이 기기의 localStorage 에만 두고, 고르지 않았으면 기기 설정을 따른다.
// index.html·admin.html 머리의 짧은 스크립트가 첫 화면을 그리기 전에 같은 키로 data-theme 을 먼저 단다(깜빡임 방지).

export type Theme = 'light' | 'dark';
export const THEME_KEY = 'whisky-dex:theme';

/** 저장된 값이 올바르면 그 값, 아니면 null */
export function parseTheme(v: unknown): Theme | null {
  return v === 'light' || v === 'dark' ? v : null;
}

/** 고른 값이 있으면 그 값, 없으면 기기 설정 */
export function resolveTheme(stored: Theme | null, prefersDark: boolean): Theme {
  return stored ?? (prefersDark ? 'dark' : 'light');
}

export function loadTheme(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): Theme | null {
  try {
    return parseTheme(storage?.getItem(THEME_KEY));
  } catch {
    return null;
  }
}

export function saveTheme(t: Theme, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(THEME_KEY, t);
  } catch {
    // 개인 정보 보호 모드 등: 이번 화면에만 적용
  }
}

const DARK_QUERY = '(prefers-color-scheme: dark)';
export const systemPrefersDark = () => typeof matchMedia === 'function' && matchMedia(DARK_QUERY).matches;

/** <html data-theme> 를 달고, 브라우저 주소창 색(theme-color)을 지금 바탕색에 맞춘다 */
export function applyTheme(t: Theme): void {
  const root = document.documentElement;
  root.dataset.theme = t;
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  if (bg) document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => (m.content = bg));
}

/** 고른 값이 없을 때 기기 설정이 바뀌면 따라간다. 해제 함수를 돌려준다 */
export function watchSystemTheme(onChange: (t: Theme) => void): () => void {
  if (typeof matchMedia !== 'function') return () => undefined;
  const mq = matchMedia(DARK_QUERY);
  const fn = (e: MediaQueryListEvent) => onChange(e.matches ? 'dark' : 'light');
  mq.addEventListener('change', fn);
  return () => mq.removeEventListener('change', fn);
}
