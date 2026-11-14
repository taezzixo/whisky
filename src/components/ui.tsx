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
