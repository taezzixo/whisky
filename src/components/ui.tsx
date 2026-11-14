// 공통 UI 조각 (테일윈드). 규칙은 docs/DESIGN_SYSTEM.md §10:
//  - Figma 변형 속성 → 리액트 속성(variant·size), 속성별 클래스 묶음은 아래 객체 한 곳에
//  - 여러 부분이 있는 블록은 합성 컴포넌트(Section + Section.Head + Section.Body)
//  - 대괄호 임의값 없이 테마 토큰 클래스만
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';

/* ── Button: Figma "Button" Variant=Primary|Ghost, Size=Sm|Md ── */
const BUTTON_VARIANT = {
  primary: 'btn', // 금박 베벨 (styles.css)
  ghost: 'btn ghost', // 유리
} as const;
const BUTTON_SIZE = {
  sm: 'min-h-tap px-3 text-sm',
  md: 'min-h-tap px-5 text-base',
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BUTTON_VARIANT; size?: keyof typeof BUTTON_SIZE };

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={`${BUTTON_VARIANT[variant]} ${BUTTON_SIZE[size]} press ${className}`} {...rest} />;
}

/* ── Chip: Figma "Chip" State=Off|On → pressed ── */
export function Chip({ pressed, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return <button type="button" className={`chip press ${className}`} aria-pressed={pressed} {...rest} />;
}

/* ── Section: 합성 컴포넌트 ── */
function SectionRoot({ children, label, glass = false, className = '' }: { children: ReactNode; label: string; glass?: boolean; className?: string }) {
  return (
    <section aria-label={label} className={`${glass ? 'panel p-5 md:p-6' : ''} flex flex-col gap-4 ${className}`}>
      {children}
    </section>
  );
}
function SectionHead({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="m-0">{title}</h2>
      {children && <p className="m-0 max-w-measure text-sm text-muted">{children}</p>}
    </div>
  );
}
function SectionBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 ${className}`}>{children}</div>;
}
export const Section = Object.assign(SectionRoot, { Head: SectionHead, Body: SectionBody });

/* ── AppLink: 화면 안 이동은 <a href> (새 탭·주소 복사 가능), 보통 클릭만 앱 안에서 처리 ── */
export function AppLink({ href, onNavigate, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; onNavigate: () => void }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate();
  };
  return <a href={href} onClick={onClick} {...rest} />;
}

/* ── ThemeSwitch: 머리 띠 오른쪽 라이트·다크 고르기 (알약 두 칸, 고른 쪽 aria-pressed) ── */
const SUN = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
const MOON = (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M13.2 10.2A5.6 5.6 0 0 1 5.8 2.8a5.6 5.6 0 1 0 7.4 7.4Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

export function ThemeSwitch({ value, onChange }: { value: 'light' | 'dark'; onChange: (t: 'light' | 'dark') => void }) {
  return (
    <div className="theme-switch" role="group" aria-label="화면 테마">
      <button type="button" aria-pressed={value === 'light'} aria-label="라이트 모드" onClick={() => onChange('light')}>
        {SUN}
        <span className="label">라이트</span>
      </button>
      <button type="button" aria-pressed={value === 'dark'} aria-label="다크 모드" onClick={() => onChange('dark')}>
        {MOON}
        <span className="label">다크</span>
      </button>
    </div>
  );
}
