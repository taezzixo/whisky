# 위스키 도감 디자인 시스템 규칙 (Figma 연동용)

> Figma MCP로 디자인을 코드로 옮기거나(Design → Code) 코드를 Figma로 보낼 때(Code → Design) 따르는 규칙입니다.
> 디자인 방향: **"비뉴 바리끄"** — 레드와인 캐스크 위스키에서 가져온 버건디·가넷·금박, 입체(유리 패널·진열 칸·3D 기울기).
> 참고한 가이드: ui-ux-pro-max 스킬(Liquid Glass 스타일, 고급 다크+골드, 접근성 체크리스트). 2026-11-14 작성.

---

## 1. 토큰 정의

**위치:** `src/styles.css` 맨 위 `:root` 블록 한 곳. 토큰 변환 도구(Style Dictionary 등)는 없고 CSS 사용자 정의 속성을 그대로 씁니다.

**구조:** 다크가 기본(`:root`)이고, 라이트는 `@media (prefers-color-scheme: light) :root:not([data-theme='dark'])`와 `:root[data-theme='light']` 두 곳에 같은 값을 다시 정의합니다. 컴포넌트는 토큰만 참조하고 색 값을 직접 쓰지 않습니다.

```css
:root {
  --bg: #170a0f;        /* 보르도 블랙 — 페이지 바탕 */
  --surface: #26121b;   /* 입력창·진열 칸 바닥 */
  --raised: #331722;    /* 떠 있는 면, 툴팁 */
  --glass: rgba(52, 22, 34, 0.62); /* 유리 패널 (backdrop-filter 와 함께) */
  --line: #55283a;      /* 경계선 */
  --line-hi: rgba(255, 224, 190, 0.14); /* 유리 윗선 하이라이트 */
  --text: #f6eadf; --text-2: #e0cabb; --muted: #b8998d;
  --gold: #d9b26a; --gold-hi: #f4da9a; --gold-lo: #8c6a2c; --gold-ink: #2a120c; /* 금박 3단 + 금 위 글자 */
  --gold-rgb: 217, 178, 106;   /* rgba() 빛 번짐용 */
  --wine: #8e1b33; --wine-hi: #b32a45; --wine-rgb: 142, 27, 51; /* 가넷 */
  --series-1: #ba841a; --series-2: #16a398; /* 차트 전용 (dataviz 검증 통과) */
  --font-display: 'Hahmlet', …; --font-latin: 'Cormorant Garamond', …; --font-body: 'IBM Plex Sans KR', …;
  --step--1 … --step-5;  /* 글자 크기 단계 (비율 1.25, 기준 15px) */
  --radius: 10px; --radius-sm: 6px;
}
```

| 그룹 | 토큰 | 쓰임 | 쓰지 말 곳 |
|---|---|---|---|
| 바탕 | `--bg` `--surface` `--raised` `--glass` | 면의 깊이 순서: bg < surface < glass < raised | 글자색 |
| 선 | `--line` `--line-hi` | 테두리, 유리 윗선(inset 0 1px 0) | |
| 글자 | `--text` `--text-2` `--muted` | 본문 / 보조 / 설명 | 큰 면 채우기 |
| 금 | `--gold*` `--gold-rgb` | 주 버튼, 선택 상태, 마신 위스키 테두리, 배지 획득 | 차트 계열색 |
| 가넷 | `--wine*` `--wine-rgb` | 배경 빛, 위시 상태, 강조 배경 | 본문 글자 |
| 차트 | `--series-1` `--series-2` | 레이더·막대·맛 지도의 데이터 표시만 | 버튼·장식 |

**Figma 변수 매핑:** Figma Variables 컬렉션 `whisky-dex`에 모드 `Dark`(기본)·`Light`를 두고, 이름은 CSS 토큰과 같게(`gold/hi` ↔ `--gold-hi`) 맞춥니다. 디자인에서 새 색이 필요하면 토큰을 먼저 추가하고(`:root` + 라이트 두 블록), 차트 색은 dataviz 검증 스크립트를 통과해야 합니다.

## 2. 컴포넌트

**위치:** `src/components/*.tsx` — React 함수 컴포넌트, 파일 하나에 화면 단위 하나. 스토리북은 없고 화면 확인은 `npm run dev` + 스크린샷으로 합니다. 계산은 `src/lib/*.ts`의 순수 함수(단위 테스트 있음)로 분리하고 컴포넌트는 표시만 합니다.

| 컴포넌트 | 역할 | 주요 CSS 클래스 |
|---|---|---|
| `Dex.tsx` | 도감: 색 띠, 배지, 나라별 수집, 진열장 | `.hero` `.band-stage` `.band` `.seals.panel` `.coin` `.cabinet` `.slot` |
| `WhiskyArt.tsx` | 실제 사진 또는 잔 일러스트 + 3D 기울기 핸들러 | `.photo` / `Glass` |
| `Glass.tsx` | 사진이 없을 때의 잔 일러스트(추정 액체 색) | `.glass` `.liquid` |
| `WhiskyRow.tsx` | 목록 한 줄 (사진·이름·스펙·이유·위시) | `.wrow` `.thumb` `.score` `.wish` |
| `WhiskyDetail.tsx` | 상세: 조명 무대, 정보, 시음 기록, 맛, 페어링, 비슷한 위스키 | `.stage` `.facts` `.flavor` `.guide.panel` `.tabs` |
| `Tasting.tsx` | 별점·시음 기록 폼 | `.tasting` `.stars` |
| `Compare.tsx` | 최대 4종 비교 (작은 레이더 + 표) | `.compare-table` `.table-wrap` |
| `HomeBar.tsx` | 내 바(보유 병·남은 양·산화 안내) | `.bar-shelf` `.bottle-card` `.fill` |
| `FlavorMap.tsx` | 맛 지도 산점도 | `.map` `.map-tip` |
| `Records.tsx` | 내 기록 화면 | `.log` `.log-item` |
| `Bti.tsx` | 위스키BTI 문항·결과 | `.quiz.panel` `.choice` `.type-head` |
| `Charts.tsx` | 레이더(최대 2계열)·10축 막대 | `.radar` `.flavor-bars` |
| `BarcodeScan.tsx` | 카메라 바코드 스캔(지원 브라우저만) | `.panel` |
| `Distilleries.tsx` | 증류소 색인(나라별 2열 목록)·증류소 페이지(라인업 진열장 + 대표 맛) | `.cabinet-row` + 테일윈드 |
| `ValueRanking.tsx` | 체감 가성비 표(`<table>`, 좁은 화면은 가격 열 숨김) | 테일윈드 |
| `TastingCard.tsx` | 테이스팅 카드 캔버스(1:1·9:16, 색은 CSS 토큰을 읽음) | `.card-canvas` + 테일윈드 |
| `ui.tsx` | `Button`(variant·size) · `Chip`(pressed) · `Section`(합성) · `AppLink`(화면 안 이동도 `<a href>`) | `.btn` `.chip` `.panel` + 테일윈드 |

**공통 패턴 — 진열 칸(입체 + 마신 위스키 금빛):**

```tsx
<button className={`slot ${tried ? 'tried' : 'untried'}`} {...tiltHandlers()}>
  <span className="art"><WhiskyArt w={w} height={140} tried={tried} /></span>
  <span className="nm">{w.nameKo ?? w.name}</span>
</button>
```

```css
.cabinet { perspective: 1100px; }
.slot { transform: rotateX(var(--rx)) rotateY(var(--ry)); transform-style: preserve-3d;
        background: linear-gradient(180deg, var(--niche-top), var(--niche-bottom));
        box-shadow: inset 0 14px 22px -10px rgba(0,0,0,.55), inset 0 -1px 0 var(--line-hi), …; }
.slot .art { transform: translateZ(28px); }               /* 병이 칸 앞으로 떠 보임 */
.slot.tried { border-color: var(--gold); box-shadow:      /* 금색 테두리 + 바깥으로 옅어지는 빛 */
  0 0 0 1px rgba(var(--gold-rgb), .9), 0 0 0 4px rgba(var(--gold-rgb), .28),
  0 0 14px 3px rgba(var(--gold-rgb), .42), 0 0 32px 8px rgba(var(--gold-rgb), .2), 0 0 64px 16px rgba(var(--gold-rgb), .08); }
.untried .photo { filter: grayscale(.92) brightness(.8); opacity: .62; }  /* 아직 못 마신 위스키 */
```

**공통 패턴 — 유리 패널:** `className="panel"` (반투명 `--glass` + `backdrop-filter: blur(16px)` + 윗선 하이라이트 + 깊은 그림자). 배지, 나라별 수집, 시음 기록, 페어링, 비교 표처럼 "한 덩어리"인 곳에만 씁니다. 모든 블록을 패널로 감싸지 않습니다.

**공통 패턴 — 금박 버튼:** `.btn`(금 그라데이션 + 위 하이라이트 + 아래 그림자), 보조는 `.btn.ghost`(유리). 눌린 상태는 `aria-pressed`로 표현합니다.

## 3. 프레임워크·도구

- React 18 + TypeScript(strict), Vite 5(빌드·개발 서버, `index.html`·`admin.html` 두 진입점)
- 스타일: 전역 CSS(`src/styles.css`, 토큰 + 기존 화면) + **테일윈드 CSS 3.4**(2026-11-14 도입, 새 화면·새 컴포넌트). CSS-in-JS·CSS Modules 없음. 테일윈드 규칙은 §10
- 런타임 의존성은 `react`, `react-dom`뿐. 차트는 SVG 직접 구현(라이브러리 없음). 새 의존성은 사용자 확인 후 추가
- 테스트: `node --test`(순수 함수), 화면은 Playwright 스크린샷으로 확인
- 배포: Cloudflare Workers 정적 자산(`wrangler.jsonc`), `prerender.mjs`가 위스키별 SEO 페이지 생성

## 4. 에셋

- **배경을 지운 병(누끼):** `public/img/w/<id>.webp` 42장 — 2026-11-14 사용자가 준 캡처에서 잘라 배경을 지움(출처·라이선스 미확인, 사용자 결정). `data/images.json`에 `cutout: true`, 원본 크기 `w`·`h`. 화면에서는 `.bottle`(병 모양 마스크로 원통 음영 `multiply` + 세로 반사광 `screen` + 바닥 타원 그림자, 진열 칸에서는 포인터를 따라 반사광 이동 `--gx`)으로 볼록하게 그립니다.
- **위스키 사진(자동 수집):** `public/img/w/<id>.(jpg|png|webp)` — `scripts/fetch-images.mjs`가 수집. 출처는 **자유 라이선스만**:
  1. Open Food Facts 제품 사진(CC BY-SA 3.0) — 바코드·이름으로 찾음
  2. 위키미디어 공용(CC BY / CC BY-SA / CC0 / 퍼블릭 도메인)
  - 쇼핑몰·브랜드 사이트 이미지는 쓰지 않습니다. 사진마다 작성자·라이선스·원본 링크를 `data/images.json`에 저장하고 상세 화면에 표시합니다(CC BY·BY-SA 표시 의무).
  - 이름·브랜드·숙성 연수가 맞을 때만 씁니다(`imageMatches`). 틀린 사진보다 사진 없음이 낫습니다.
  - 사진이 없으면 `Glass` 잔 일러스트(캐스크·숙성으로 추정한 액체 색)를 그립니다.
- **최적화:** 400px 썸네일만 저장, `<img loading="lazy" decoding="async">`, 높이 고정으로 레이아웃 흔들림 방지. 캐시는 `public/_headers`(`/assets/*` 1년, `/data/*` 10분).
- **글꼴:** Google Fonts(Hahmlet, IBM Plex Sans KR, Cormorant Garamond) — `index.html`·`admin.html`의 `<link>`. 대체 글꼴 스택 필수.
- **CDN:** 별도 CDN 없음(Cloudflare가 정적 자산을 서빙).
- Figma에서 내보내는 이미지는 `public/img/`에 두고, 라이선스가 확인된 것만 커밋합니다.

## 5. 아이콘

- 아이콘 세트·아이콘 폰트 없음. 필요한 그림은 컴포넌트 안 인라인 SVG(`Glass`의 잔, `Stars`의 별, 배지 동전은 CSS)로 그립니다.
- **이모지를 아이콘으로 쓰지 않습니다**(ui-ux-pro-max 체크리스트). BTI 보기의 이모지는 금색 원 표시(`.choice .mark`)로 바꿨습니다.
- 새 아이콘은 `currentColor`를 쓰는 인라인 SVG, 장식이면 `aria-hidden="true"`, 의미가 있으면 `aria-label`.
- Figma 아이콘 컴포넌트 이름은 `icon/<이름>`(예: `icon/glass`, `icon/star`)으로 맞추고 코드에서는 같은 이름의 컴포넌트로 만듭니다.

## 6. 스타일 방식

- **방법론:** 의미 있는 짧은 클래스(`.slot`, `.panel`, `.wrow`) + 상태 클래스(`.tried`, `.untried`) + ARIA 속성 상태(`[aria-pressed='true']`, `[aria-selected='true']`, `[aria-current='page']`). 선택자 깊이는 2단계 이내.
- **전역 스타일:** `body`에 배경 빛(가넷·금 radial-gradient), 한국어 줄바꿈 `word-break: keep-all`, `accent-color: var(--gold)`.
- **입체 규칙:** 깊이 순서는 bg → 진열 칸(안쪽 그림자) → 유리 패널 → 떠 있는 요소(raised·툴팁). 3D 기울기는 마우스 포인터에만 반응하고 최대 8°, `prefers-reduced-motion`이면 끕니다.
- **움직임:** 사용자 동작에 대한 반응만 150~300ms. 자동 움직임은 첫 화면 색 띠가 차오르는 한 번뿐.
- **반응형:** 모바일 우선이 아니라 넓은 화면 기준 + `@media (max-width: 720px)` 한 구간. 그리드는 `auto-fill, minmax()`로 자연스럽게 열 수가 줄어듭니다. 좌우 여백은 `max(16px, env(safe-area-inset-*))`, 가로 스크롤 금지(표는 `.table-wrap` 안에서만).
- **접근성:** 터치 대상 최소 44px, 키보드 포커스 `:focus-visible` 금색 링, 대비 4.5:1, 차트는 표 보기(10축 막대·비교 표) 제공.
- **쓰지 않는 것:** 대문자 라벨, "A · B · C" 메타 문자열, 모든 블록을 같은 카드로 감싸기, 이모지 아이콘, 차트에 버튼 강조색.

## 7. 프로젝트 구조

```
src/
├─ App.tsx              # 탭 라우팅(?tab=, ?w=), 사용자 데이터 상태
├─ components/          # 화면 단위 컴포넌트 (위 표)
├─ lib/                 # 순수 함수 + 테스트: similar, bti, collection(수집·배지·가상 바·바코드), liquid, pairing, store
├─ config/              # flavor(맛 축·가중치 버전), bti(문항)
├─ admin/main.tsx       # /admin.html
├─ styles.css           # 토큰 + 전역 + 컴포넌트 스타일 (한 파일)
└─ types.ts             # Whisky 등 공통 형식
public/img/w/           # 실제 사진 (자유 라이선스)
scripts/                # 수집(fetch-whiskies, fetch-images), prerender
```

- 기능 추가 순서: 계산 로직을 `src/lib`에 순수 함수 + 테스트로 → 화면은 `src/components` → 토큰이 필요하면 `styles.css` `:root`(라이트 두 블록 포함).

## 8. Figma MCP 작업 규칙

**Design → Code**
1. Figma 링크에서 `fileKey`·`nodeId`를 뽑고 `create_session` → `get_design_context`(figma-design-to-code 스킬 먼저 로드).
2. 받은 코드는 **참고용**입니다. 대괄호 임의값(`w-[13px]`)·절대 위치·하드코딩 색을 그대로 붙이지 말고, §10 테마 토큰 클래스와 위 컴포넌트로 다시 씁니다.
3. Figma 색이 토큰에 없으면 가장 가까운 토큰을 쓰고, 정말 새 색이면 토큰을 추가한 뒤 사용자에게 알립니다.
4. 이미지·아이콘은 §4·§5 규칙(자유 라이선스, 인라인 SVG)을 따릅니다. Figma의 사진 레이어를 그대로 내보내 커밋하지 않습니다.
5. 만든 화면은 라이트·다크·390px에서 스크린샷으로 확인합니다.

**Code → Design**
1. figma-generate-design 스킬 로드 → 새 파일이면 `create_new_file` → `create_session` → `search_design_system`.
2. Figma Variables를 §1 토큰 이름 그대로 만들고(Dark/Light 모드), 컴포넌트는 §2 이름(`Slot`, `Panel`, `WhiskyRow`, `Stage`, `Coin`)으로 만듭니다.
3. 마신 위스키 금빛 테두리는 Figma에서 Drop shadow 여러 겹(1px 90% → 4px 28% → 14px 42% → 32px 20% → 64px 8%)으로 재현합니다.

## 9. 출시 전 점검표 (ui-ux-pro-max 체크리스트 반영)

- [ ] 이모지 아이콘 없음, 클릭 가능한 요소는 `cursor: pointer`
- [ ] 마우스 오버·누름 반응 150~300ms
- [ ] 라이트 모드 글자 대비 4.5:1 이상
- [ ] 키보드 포커스 보임
- [ ] `prefers-reduced-motion`이면 3D 기울기·차오름 꺼짐
- [ ] 375 / 768 / 1024 / 1440px에서 가로 스크롤 없음
- [ ] 차트 색은 `--series-*`만, 검증 스크립트 통과
- [ ] 사진마다 작성자·라이선스 표시

## 10. 테일윈드 테마 연동 (2026-11-14)

토큰의 값은 `src/styles.css` `:root`(+라이트 두 블록)에만 있고, `tailwind.config.js`는 그 CSS 변수에 **이름만** 붙입니다. 그래서 라이트·다크 전환은 CSS 변수가 알아서 하고, 테일윈드 클래스는 테마를 몰라도 됩니다. `theme`은 `extend`가 아니라 통째로 바꿔서, 토큰에 없는 색·여백·그림자는 클래스 자체가 만들어지지 않습니다. 기존 전역 스타일과 부딪히지 않게 preflight는 끕니다.

| Figma 변수 (whisky-dex) | CSS 토큰 | 테일윈드 클래스 예 |
|---|---|---|
| color/bg, surface, raised, glass | `--bg` `--surface` `--raised` `--glass` | `bg-bg` `bg-surface` `bg-raised` `bg-glass` |
| color/line, line/hi | `--line` `--line-hi` | `border-line` `border-line-hi` |
| color/text, text/2, muted | `--text` `--text-2` `--muted` | `text-text` `text-text-2` `text-muted` |
| color/gold, gold/hi, gold/lo, gold/ink | `--gold*` | `text-gold` `bg-gold` `border-gold-lo` `text-gold-ink` |
| color/wine, wine/hi | `--wine*` | `bg-wine` `text-wine-hi` |
| color/series/1·2 (차트 전용) | `--series-1` `--series-2` | `fill-series-1` `stroke-series-2` |
| type/display, latin, body | `--font-display` `--font-latin` `--font-body` | `font-display` `font-latin` `font-body` |
| type/step -1 … 5 | `--step--1` … `--step-5` | `text-sm` `text-base` `text-lg` `text-xl` `text-2xl` `text-3xl` `text-4xl` |
| space/1 … 16 (4px 기준) | `--space-1` … `--space-16` | `p-4` `gap-2` `mt-6` (1·2·3·4·5·6·8·10·12·16만 존재) |
| size/tap, measure, container | `--tap` `--measure` `--container` | `min-h-tap` `min-w-tap` `max-w-measure` `max-w-container` |
| radius/sm, md, pill | `--radius-sm` `--radius` `--radius-pill` | `rounded-sm` `rounded` `rounded-pill` |
| effect/panel, lift, tried | `--shadow-panel` `--shadow-lift` `--glow-tried` | `shadow-panel` `shadow-lift` `shadow-tried` |
| motion/ease-out, in-out, spring | `--ease-out` `--ease-in-out` `--ease-spring` | `ease-out` `ease-in-out` `ease-spring` |
| motion/press, ui, panel | `--dur-press`(140ms) `--dur-ui`(200ms) `--dur-panel`(280ms) | `duration-press` `duration-ui` `duration-panel` |

**규칙**

1. **대괄호 임의값 금지.** `p-[13px]`, `bg-[#fff]`, `[mask:…]` 같은 클래스는 쓰지 않습니다. `scripts/lib/tailwind-guard.test.mjs`가 `npm test`에서 막습니다. 필요한 값이 없으면 토큰을 먼저 추가(§1)하고 `tailwind.config.js`에 이름을 붙입니다.
2. **오토 레이아웃 → 플렉스/그리드 1:1.**

   | Figma 오토 레이아웃 | 테일윈드 |
   |---|---|
   | 방향 가로 / 세로 | `flex flex-row` / `flex flex-col` |
   | 간격(item spacing) 8 | `gap-2` (토큰 단계로 반올림) |
   | 패딩 16 / 가로 24·세로 12 | `p-4` / `px-6 py-3` |
   | 정렬 위·가운데·아래 | `items-start` `items-center` `items-end` |
   | 분배 Packed / Space between | `justify-start` / `justify-between` |
   | 줄바꿈(Wrap) | `flex-wrap` |
   | 자식 Fill container / Hug | `flex-1 min-w-0` / `shrink-0` |
   | 고정 열 수 그리드 | `grid grid-cols-2 md:grid-cols-4` |
   | 반응형 카드 열 | `grid` + `.auto-grid`(styles.css 의 `repeat(auto-fill, minmax(…))`) |

3. **변형(variant) → 컴포넌트 속성.** Figma 컴포넌트 속성 `Variant=Primary|Ghost`, `Size=Sm|Md`, `State=Tried|Untried`는 리액트 속성 `variant: 'primary' | 'ghost'`, `size: 'sm' | 'md'`, `tried: boolean`으로 옮기고, 속성별 클래스 묶음은 컴포넌트 안의 객체 한 곳(`const VARIANT = { primary: '…', ghost: '…' }`)에 둡니다.
4. **합성 컴포넌트가 기본.** 여러 부분이 있는 블록은 `<Section>` + `<Section.Head>` + `<Section.Body>`처럼 부모가 틀을, 자식이 부분을 맡게 만듭니다(예: `src/components/ui.tsx`).
5. 기존 CSS 클래스(`.panel`, `.btn`, `.slot` 등 3D·유리 효과)는 그대로 쓰고, 배치·여백·글자는 테일윈드로 얹습니다. 같은 요소에 같은 속성을 두 방식으로 주지 않습니다.
