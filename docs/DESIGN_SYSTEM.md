# 위스키 도감 디자인 시스템 규칙 (Figma 연동용)

> Figma MCP로 디자인을 코드로 옮기거나(Design → Code) 코드를 Figma로 보낼 때 따르는 규칙입니다.
> **v2 (2026-11-14, 사용자 요청):** 사용자가 준 레퍼런스 캡처의 톤으로 다시 설정. 차가운 종이색 바탕, 남색 잉크, 코발트 하나. 제목은 고대비 세리프(Cormorant Garamond + Noto Serif KR), 라벨은 IBM Plex Mono. 따뜻한 색은 위스키(잔 속 액체 색)와 차트 앰버뿐.
> v1 "비뉴 바리끄"(보르도 블랙·가넷·금박)는 v2로 대체됐습니다.
> 기준 아티팩트: claude.ai 디자인 시스템 「위스키 도감」 https://claude.ai/artifact/U8czkA1r39HCPUg5WApU18 (토큰·브랜드북·컴포넌트 19종 미리보기). 값이 다르면 `src/styles.css`가 기준입니다.

---

## 1. 토큰 정의

**위치:** `src/styles.css` 맨 위 `:root` 블록 한 곳(페이퍼 = 라이트, 기본). 미드나이트(다크)는 `@media (prefers-color-scheme: dark) :root:not([data-theme='light'])`와 `:root[data-theme='dark'], [data-theme='midnight']` 두 곳에 같은 값을 다시 정의합니다. 한 구역만 어둡게 하려면 그 요소에 `data-theme="midnight"`를 답니다(숫자 띠). 머리 띠 오른쪽 `ThemeSwitch`(해·달 알약 두 칸)로 고르면 `<html data-theme>`에 `light`/`dark`가 달리고 이 기기의 localStorage(`whisky-dex:theme`)에만 남습니다. 고르지 않았으면 기기 설정을 따릅니다. `index.html`·`admin.html` 머리의 짧은 스크립트가 첫 화면 전에 적용해 깜빡이지 않습니다.

| 그룹 | 토큰 (페이퍼 / 미드나이트) | 쓰임 | 쓰지 말 곳 |
|---|---|---|---|
| 면 | `--bg` #f7f9fb / #050816, `--surface` #ffffff / #0b1222, `--sunken` #f1f4f9 / #080d1a, `--glass` | 깊이: sunken(진열 칸·무대) < bg < surface(카드·입력칸). glass는 머리 띠만 | 글자색 |
| 선 | `--line` #e4e8ef / #1c2740, `--line-strong` #7c879b / #56647f, `--grid`, `--dot` | line은 장식 헤어라인. 테두리가 조작 대상을 알리면 line-strong(3:1 이상) | |
| 글자 | `--text` #0b1020 / #eef2f9, `--text-2` #4a5468 / #b4bdd0, `--muted` #667085 / #8c97ad | 제목·본문 / 설명 / 보조 정보(모든 바탕 4.5:1 이상) | muted를 accent-soft 위에 |
| 강조 | `--accent` #2453e0 / #5b8cff, `--accent-hover`, `--accent-soft`, `--accent-ink`, `--on-accent`, `--halo` | 주 버튼, 링크, 켜진 탭, 마신 위스키 테두리, 포커스 링 | 장식, 차트 |
| 빛 | `--tint` #c9d6f7 / #22356b | 히어로·무대의 옅은 페리윙클 빛과 하프톤 도트 | 글자 바탕 |
| 차트 | `--series-1` #b86a12 / #bd7f22 (앰버), `--series-2` #1f6fa8 / #4a92d4 (스틸 블루) | 레이더·막대·맛 지도의 데이터만. dataviz 검증 통과 | 버튼·장식 |
| 경고 | `--warn` #b42318 / #ff8a7a | 산화 안내 등 경고 글자 | |
| 글꼴 | `--font-display`(Cormorant Garamond, Noto Serif KR) `--font-body`(Inter, IBM Plex Sans KR) `--font-mono`(IBM Plex Mono) | 제목 / 본문 / 라벨·숫자. `--font-outlier`는 mono와 같은 값(Hallmark용 이름) | |
| 크기 | `--step--2` 0.6875 … `--step-5` 5.25rem | 라벨 11px, 본문 15px, h2 36px, h1 48px | |
| 여백 | `--space-0` … `--space-32`(4px 기준, 24=96px, 32=128px) | 섹션 사이 space-24, 제목 블록과 내용 space-12 | |
| 반경 | `--radius-sm` 6, `--radius` 16, `--radius-lg` 24, `--radius-xl` 32, `--radius-pill` | 버튼·입력칸 / 카드 / 사진·무대 / 히어로 판 / 알약 | |
| 그림자 | `--shadow-card`, `--shadow-lift`, `--shadow-bottle`, `--glow-tried` | 경계는 헤어라인이 맡고, 그림자는 떠 있는 것(툴팁·트레이·hover)과 마신 위스키에만 | 테두리와 겹치기 |

**Figma 변수 매핑:** Figma Variables 컬렉션 `whisky-dex`에 모드 `Paper`(기본)·`Midnight`를 두고, 이름은 CSS 토큰과 같게(`accent/ink` ↔ `--accent-ink`) 맞춥니다. 새 색이 필요하면 토큰을 먼저 추가하고(`:root` + 미드나이트 두 블록), 차트 색은 dataviz 검증 스크립트를 통과해야 합니다.

## 2. 컴포넌트

**위치:** `src/components/*.tsx` — React 함수 컴포넌트, 파일 하나에 화면 단위 하나. 계산은 `src/lib/*.ts`의 순수 함수(단위 테스트 있음)로 분리하고 컴포넌트는 표시만 합니다.

| 컴포넌트 | 역할 | 주요 CSS 클래스 |
|---|---|---|
| `App.tsx` 머리 띠 | 세리프 워드마크 + 코발트 점, 가운데 알약 탭 묶음, 오른쪽 라이트·다크 고르기(`ThemeSwitch`) | `.top` `.wordmark` `.nav` `.end` `.theme-switch` |
| `Dex.tsx` | 도감: 히어로 판의 색 띠, 배지, 나라별 수집, 진열장 | `.hero` `.band` `.seals.panel` `.coin` `.countries` `.cabinet` `.slot` |
| `WhiskyArt.tsx` | 실제 사진·배경 지운 병·잔 일러스트 + 3D 기울기(최대 6°) | `.bottle` `.photo` / `Glass` |
| `Glass.tsx` | 사진이 없을 때의 잔 일러스트(추정 액체 색) | `.glass` `.liquid` |
| `WhiskyRow.tsx` | 목록 한 줄(헤어라인으로만 구분) | `.wrow` `.thumb` `.score` `.wish` `.tag-line` |
| `WhiskyDetail.tsx` | 상세: 무대, 사실 표, 시음 기록, 맛, 페어링, 비슷한 위스키 | `.stage` `.facts` `.flavor` `.guide.panel` `.tabs` |
| `Tasting.tsx` | 별점(잉크 한 색)·시음 기록 폼 | `.tasting` `.stars` |
| `Compare.tsx` | 최대 4종 비교 | `.compare-table` `.table-wrap` `.compare-tray` |
| `HomeBar.tsx` | 내 바(보유 병·남은 양 2px 선·산화 안내) | `.bar-shelf` `.bottle-card` `.fill` |
| `FlavorMap.tsx` | 맛 지도 산점도 | `.map` `.map-tip` |
| `Records.tsx` | 내 기록 | `.log` `.log-item` |
| `Bti.tsx` | 위스키BTI 문항·결과 | `.quiz.panel` `.choice` `.type-head` |
| `Charts.tsx` | 레이더(최대 2계열)·10축 막대 | `.radar` `.flavor-bars` |
| `Distilleries.tsx` | 증류소 색인·페이지 | `.hero` `.cabinet-row` + 테일윈드 |
| `TastingCard.tsx` | 테이스팅 카드 캔버스(종이색 + 헤어라인 액자, 색은 CSS 토큰을 읽음) | `.card-canvas` |
| `ui.tsx` | `Button`(variant·size) · `Chip`(pressed) · `Section`(합성) · `AppLink` | `.btn` `.chip` `.panel` |

v2에서 새로 생긴 클래스(디자인 시스템 아티팩트와 같음): `.eyebrow`(h2 위 라벨, h1 위에는 쓰지 않음), `.sec-index`("01 / 06"), `.arrow-link`(48px 원형 화살표), `.stat` `.numeral`(숫자 카드, 올드스타일 숫자 + accent 기호), `.midnight-band`, `.dots`(24px 도트 무늬), `.lead` `.note`.

**서명 — 마신 위스키:** 진열 칸 그림 판과 무대에 `accent` 1px 테두리 + `--glow-tried`(5px 옅은 띠 + 아래로 번지는 푸른 빛). 다른 강조에 쓰지 않습니다. 못 마신 위스키는 사진 흑백·투명 60%, 잔은 점선.

```tsx
<button className={`slot ${tried ? 'tried' : 'untried'}`} {...tiltHandlers()}>
  <span className="art"><WhiskyArt w={w} height={140} tried={tried} /></span>
  <span className="meta"><span className="nm">{w.nameKo ?? w.name}</span><span className="sub">{w.country}</span></span>
</button>
```

**카드:** `.panel`은 흰 면 + 1px `line`, 그림자 없음(Hallmark F24: 헤어라인과 넓은 그림자를 겹치지 않음). 배지·시음 기록·페어링·비교 표처럼 한 덩어리인 곳에만 쓰고, 나머지는 여백과 헤어라인으로 나눕니다.

**버튼:** `.btn`은 평평한 코발트(6px 모서리, 그라데이션·큰 그림자 없음), 보조 `.btn.ghost`는 흰 면 + `line-strong` 테두리. 눌린 상태는 `aria-pressed`. 칩이 켜지면 잉크로 뒤집히고(바탕 `text`), 탭이 켜지면 `accent-soft`.

## 3. 프레임워크·도구

- React 18 + TypeScript(strict), Vite 5(빌드·개발 서버, `index.html`·`admin.html` 두 진입점)
- 스타일: 전역 CSS(`src/styles.css`, 토큰 + 기존 화면) + **테일윈드 CSS 3.4**(2026-11-14 도입, 새 화면·새 컴포넌트). CSS-in-JS·CSS Modules 없음. 테일윈드 규칙은 §10
- 런타임 의존성은 `react`, `react-dom`뿐. 차트는 SVG 직접 구현(라이브러리 없음). 새 의존성은 사용자 확인 후 추가
- 테스트: `node --test`(순수 함수), 화면은 Playwright 스크린샷으로 확인
- 배포: Cloudflare Workers 정적 자산(`wrangler.jsonc`), `prerender.mjs`가 위스키별 SEO 페이지 생성

## 4. 에셋

- **배경을 지운 병(누끼):** `public/img/w/<id>.webp` 42장 — 2026-11-14 사용자가 준 캡처에서 잘라 배경을 지움(출처·라이선스 미확인, 사용자 결정). `data/images.json`에 `cutout: true`, 원본 크기 `w`·`h`. 화면에서는 `.bottle`(병 모양 마스크로 원통 음영 `multiply` + 세로 반사광 `screen` + 옅은 바닥 그림자, 진열 칸에서는 포인터를 따라 반사광 이동 `--gx`)으로 볼록하게 그립니다. 놓이는 판은 `sunken`.
- **위스키 사진(자동 수집):** `public/img/w/<id>.(jpg|png|webp)` — `scripts/fetch-images.mjs`가 수집. 출처는 **자유 라이선스만**:
  1. Open Food Facts 제품 사진(CC BY-SA 3.0) — 바코드·이름으로 찾음
  2. 위키미디어 공용(CC BY / CC BY-SA / CC0 / 퍼블릭 도메인)
  - 쇼핑몰·브랜드 사이트 이미지는 쓰지 않습니다. 사진마다 작성자·라이선스·원본 링크를 `data/images.json`에 저장하고 상세 화면에 표시합니다(CC BY·BY-SA 표시 의무).
  - 이름·브랜드·숙성 연수가 맞을 때만 씁니다(`imageMatches`). 틀린 사진보다 사진 없음이 낫습니다.
  - 사진이 없으면 `Glass` 잔 일러스트(캐스크·숙성으로 추정한 액체 색)를 그립니다.
- **최적화:** 400px 썸네일만 저장, `<img loading="lazy" decoding="async">`, 높이 고정으로 레이아웃 흔들림 방지. 캐시는 `public/_headers`(`/assets/*` 1년, `/data/*` 10분).
- **글꼴:** Google Fonts(Cormorant Garamond, Noto Serif KR, Inter, IBM Plex Sans KR, IBM Plex Mono) — `index.html`·`admin.html`의 `<link>`. 대체 글꼴 스택 필수.
- **CDN:** 별도 CDN 없음(Cloudflare가 정적 자산을 서빙).
- Figma에서 내보내는 이미지는 `public/img/`에 두고, 라이선스가 확인된 것만 커밋합니다.

## 5. 아이콘

- 아이콘 세트·아이콘 폰트 없음. 1.4px 선의 인라인 SVG(→, ↗, 별, 잔)를 `currentColor`로. 장식이면 `aria-hidden="true"`, 의미가 있으면 `aria-label`.
- **이모지를 아이콘으로 쓰지 않습니다.** 선택 표시는 10px 원(`.choice .mark`).
- 워드마크는 로고 파일 없이 "위스키 도감"(세리프 600) + 6px `accent` 점(`.wordmark i`).
- Figma 아이콘 컴포넌트 이름은 `icon/<이름>`(예: `icon/glass`, `icon/arrow`)으로 맞춥니다.

## 6. 스타일 방식

- **방법론:** 의미 있는 짧은 클래스(`.slot`, `.panel`, `.wrow`) + 상태 클래스(`.tried`, `.untried`) + ARIA 속성 상태(`[aria-pressed='true']`, `[aria-selected='true']`, `[aria-current='page']`). 선택자 깊이는 2단계 이내.
- **전역:** `body`는 `bg` 단색(배경 그라데이션 없음), 한국어 `word-break: keep-all`, `accent-color: var(--accent)`.
- **글자:** 제목은 세리프 500, 자간 -0.01~-0.02em. 제목 속 숫자는 라이닝 숫자(`12년`), 통계 숫자만 올드스타일. 라벨·번호·출처·점수는 IBM Plex Mono, **자간 0.02em 이하**(Hallmark 67은 넓은 자간 라벨을 막는 바닥 규칙이라 예외를 둘 수 없음). 영문 대문자 라벨은 쓰지 않습니다.
- **여백:** 섹션 사이 `space-24`(모바일 `space-16`), 제목 블록과 내용 `space-12`.
- **움직임:** 사용자 동작에 대한 반응만 140~320ms, 강한 ease-out. 자동 움직임은 첫 화면 색 띠가 차오르는 한 번뿐. `prefers-reduced-motion`이면 끕니다.
- **반응형:** 넓은 화면 기준 + `@media (max-width: 720px)` 한 구간. 머리 띠 탭은 둘째 줄로 내려가 가로로 넘깁니다. 가로 스크롤 금지(표는 `.table-wrap` 안에서만).
- **접근성:** 터치 대상 최소 44px, 포커스 2px `accent` 링(입력칸은 `halo` 4px), 대비 4.5:1, 차트는 표 보기 제공, 계열은 색 + 점선으로 구분.
- **쓰지 않는 것:** 금색·와인색, 그라데이션 버튼, 영문 대문자 라벨, 넓은 자간 라벨, "A · B · C" 메타 문자열, 모든 블록 카드화, 이모지 아이콘, 차트에 강조색.

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
2. Figma Variables를 §1 토큰 이름 그대로 만들고(Paper/Midnight 모드), 컴포넌트는 §2 이름(`Slot`, `Panel`, `WhiskyRow`, `Stage`, `Coin`)으로 만듭니다.
3. 마신 위스키 코발트 테두리는 Figma에서 Stroke 1px `accent` + Drop shadow 두 겹(spread 5px `accent` 12%, y 18 blur 36 spread -18 `accent` 45%)으로 재현합니다.

## 9. 출시 전 점검표

- [ ] 이모지 아이콘 없음, 클릭 가능한 요소는 `cursor: pointer`
- [ ] 반응 140~320ms, 줄인 움직임 설정이면 꺼짐
- [ ] 페이퍼·미드나이트 모두 글자 대비 4.5:1 이상
- [ ] 키보드 포커스 보임
- [ ] 375 / 768 / 1024 / 1440px에서 가로 스크롤 없음
- [ ] 차트 색은 `--series-*`만, 검증 스크립트 통과
- [ ] 사진마다 작성자·라이선스 표시
- [ ] `node .claude/skills/hallmark/scripts/sloplint.mjs src --genre atmospheric --scope app` FAIL 0

## 10. 테일윈드 테마 연동

토큰의 값은 `src/styles.css`에만 있고, `tailwind.config.js`는 그 CSS 변수에 **이름만** 붙입니다. `theme`은 `extend`가 아니라 통째로 바꿔서, 토큰에 없는 색·여백·그림자는 클래스 자체가 없습니다. preflight는 끕니다.

| Figma 변수 (whisky-dex) | CSS 토큰 | 테일윈드 클래스 예 |
|---|---|---|
| color/bg, surface, sunken, glass | `--bg` `--surface` `--sunken` `--glass` | `bg-bg` `bg-surface` `bg-sunken` `bg-glass` |
| color/line, line/strong | `--line` `--line-strong` | `border-line` `border-line-strong` |
| color/text, text/2, muted | `--text` `--text-2` `--muted` | `text-text` `text-text-2` `text-muted` |
| color/accent, hover, soft, ink, on | `--accent*` `--on-accent` | `bg-accent` `hover:bg-accent-hover` `bg-accent-soft` `text-accent-ink` `text-accent-on` |
| color/series/1·2 (차트 전용) | `--series-1` `--series-2` | `fill-series-1` `stroke-series-2` |
| type/display, body, mono | `--font-display` `--font-body` `--font-mono` | `font-display` `font-body` `font-mono` |
| type/step -1 … 5 | `--step--1` … `--step-5` | `text-sm` `text-base` `text-lg` `text-xl` `text-2xl` `text-3xl` `text-4xl` |
| space/1 … 32 (4px 기준) | `--space-1` … `--space-32` | `p-4` `gap-2` `mt-24` (1·2·3·4·5·6·8·10·12·16·24·32만 존재) |
| size/tap, measure, container | `--tap` `--measure` `--container` | `min-h-tap` `max-w-measure` `max-w-container` |
| radius/sm, md, lg, xl, pill | `--radius-sm` `--radius` `--radius-lg` `--radius-xl` `--radius-pill` | `rounded-sm` `rounded` `rounded-lg` `rounded-xl` `rounded-pill` |
| effect/card, lift, tried | `--shadow-card` `--shadow-lift` `--glow-tried` | `shadow-card` `shadow-lift` `shadow-tried` |
| motion/ease, duration | `--ease-*` `--dur-press`(140) `--dur-ui`(200) `--dur-panel`(320) | `ease-out` `duration-ui` |

v1 → v2 이름 대응: `gold*` → `accent*`(`gold-text` → `accent-ink`), `wine*` 없음, `raised`·`niche-*` → `sunken`, `field-line` → `line-strong`, `font-latin` → `font-mono`, `shadow-panel` → `shadow-card`.

**규칙**

1. **대괄호 임의값 금지.** `p-[13px]`, `bg-[#fff]` 같은 클래스는 `scripts/lib/tailwind-guard.test.mjs`가 `npm test`에서 막습니다. 필요한 값이 없으면 토큰을 먼저 추가하고 `tailwind.config.js`에 이름을 붙입니다.
2. **오토 레이아웃 → 플렉스/그리드 1:1.** 방향 `flex-row`/`flex-col`, 간격 `gap-*`(토큰 단계로 반올림), 패딩 `p-*`, 정렬 `items-*`, 분배 `justify-*`, 줄바꿈 `flex-wrap`, Fill `flex-1 min-w-0`, Hug `shrink-0`, 반응형 카드 열은 `grid` + `.auto-grid`.
3. **변형(variant) → 컴포넌트 속성.** `Variant=Primary|Ghost`, `Size=Sm|Md`, `State=Tried|Untried` → `variant`, `size`, `tried`. 속성별 클래스 묶음은 컴포넌트 안 객체 한 곳에.
4. **합성 컴포넌트가 기본.** `<Section>` + `<Section.Head>` + `<Section.Body>`.
5. 기존 CSS 클래스(`.panel`, `.btn`, `.slot` 등)는 그대로 쓰고, 배치·여백·글자는 테일윈드로 얹습니다. 같은 요소에 같은 속성을 두 방식으로 주지 않습니다.

## 12. 움직임·차트 라이브러리 (2026-11-18 사용자 요청)

| 라이브러리 | 쓰는 곳 | 규칙 |
|---|---|---|
| Anime.js 4 (`animejs/animation`, `animejs/utils`만) | 로고 글자 인트로 | 세션당 한 번, `prefers-reduced-motion`이면 안 함 (`src/lib/intro.ts`) |
| Motion 14 (`m` 컴포넌트 + `LazyMotion`, 기능은 `motion-features.ts`로 지연 로드) | 메뉴·테마 선택 알약(`layoutId`), 버튼·칩 누름 스프링(0.96), 화면 전환 페이드 220ms | `MotionConfig reducedMotion="user"`. 새 움직임도 `m.*`로 쓴다(`motion.*` 금지: 번들이 커짐) |
| Bklit UI (원본 일부 복사, `src/vendor/bklit/`) | 상세 맛 프로필 레이더(10축), 숫자는 `@number-flow/react` | 차트 색은 `--series-1`·`--series-2`만. Bklit 변수(`--chart-*`, `--border`)는 토큰 블록에서 우리 토큰을 가리키게 둔다 |

- 첫 화면은 "내 바 선반"(최근 마신 병 7자리, 빈 자리는 점선) + "최근 마신 잔" 목록 + "다음 잔" 추천 카드입니다. 예전의 798칸 색 띠는 뺐습니다.
- 첫 화면 스크립트는 gzip 약 113KB(이전 33KB). 대부분 Motion 엔진이라, 더 줄여야 하면 버튼 누름은 CSS로 돌리고 Motion은 메뉴 알약·화면 전환에만 남깁니다.
