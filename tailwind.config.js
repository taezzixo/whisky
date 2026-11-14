// 테일윈드 테마 = src/styles.css :root 토큰의 별칭. 값은 CSS 변수에만 있고 여기서는 이름만 잇는다.
// theme 를 extend 하지 않고 통째로 바꿔서, 토큰에 없는 색·여백·그림자는 클래스 자체가 없다.
// 대괄호 임의값(`p-[13px]`, `bg-[#fff]`)은 scripts/lib/tailwind-guard.test.mjs 가 막는다.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false }, // 기존 전역 스타일(styles.css)을 그대로 둔다
  theme: {
    screens: { md: '721px', lg: '1024px' }, // 모바일 우선. styles.css 의 max-width:720px 와 같은 경계
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: 'var(--bg)',
      surface: 'var(--surface)',
      raised: 'var(--raised)',
      glass: 'var(--glass)',
      line: { DEFAULT: 'var(--line)', hi: 'var(--line-hi)' },
      text: { DEFAULT: 'var(--text)', 2: 'var(--text-2)' },
      muted: 'var(--muted)',
      gold: { DEFAULT: 'var(--gold)', hi: 'var(--gold-hi)', lo: 'var(--gold-lo)', ink: 'var(--gold-ink)', text: 'var(--gold-text)' }, // text = 글자용(라이트에서 더 진함)
      wine: { DEFAULT: 'var(--wine)', hi: 'var(--wine-hi)' },
      warn: 'var(--warn)',
      series: { 1: 'var(--series-1)', 2: 'var(--series-2)' },
    },
    fontFamily: {
      display: 'var(--font-display)',
      latin: 'var(--font-latin)',
      body: 'var(--font-body)',
    },
    fontSize: {
      sm: ['var(--step--1)', { lineHeight: '1.5' }],
      base: ['var(--step-0)', { lineHeight: '1.7' }],
      lg: ['var(--step-1)', { lineHeight: '1.45' }],
      xl: ['var(--step-2)', { lineHeight: '1.3' }],
      '2xl': ['var(--step-3)', { lineHeight: '1.2' }],
      '3xl': ['var(--step-4)', { lineHeight: '1.15' }],
      '4xl': ['var(--step-5)', { lineHeight: '1.1' }],
    },
    fontWeight: { normal: '400', medium: '500', semibold: '600', bold: '700' },
    spacing: {
      0: 'var(--space-0)',
      px: '1px',
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      3: 'var(--space-3)',
      4: 'var(--space-4)',
      5: 'var(--space-5)',
      6: 'var(--space-6)',
      8: 'var(--space-8)',
      10: 'var(--space-10)',
      12: 'var(--space-12)',
      16: 'var(--space-16)',
      tap: 'var(--tap)',
    },
    maxWidth: { measure: 'var(--measure)', container: 'var(--container)', full: '100%' },
    minWidth: { 0: '0', tap: 'var(--tap)' },
    minHeight: { tap: 'var(--tap)' },
    borderRadius: { none: '0', sm: 'var(--radius-sm)', DEFAULT: 'var(--radius)', pill: 'var(--radius-pill)' },
    boxShadow: {
      none: 'none',
      panel: 'var(--shadow-panel)',
      lift: 'var(--shadow-lift)',
      tried: 'var(--glow-tried)',
    },
    transitionTimingFunction: { out: 'var(--ease-out)', 'in-out': 'var(--ease-in-out)', spring: 'var(--ease-spring)' },
    transitionDuration: { press: 'var(--dur-press)', ui: 'var(--dur-ui)', panel: 'var(--dur-panel)' },
    extend: {},
  },
  plugins: [],
};
