# 위스키 도감 (whisky) — 작업 가이드

새 대화를 시작하면 이 파일을 먼저 읽습니다. 진행 상황과 결정 사항은 Notion 「대시보드 v1.0 / [위스키 도감] (whisky)」 아래 인계 문서에 있습니다(Notion이 연결되지 않았을 때는 `docs/HANDOFF.md`).

## 한눈에 보기
- 마신 위스키를 도감에 기록(별점·메모)하고, 위스키BTI로 취향 유형을 찾고, 비슷한 위스키를 추천하는 웹사이트입니다. 도감 345종(맛 정보 있음) + 수집 카탈로그 약 3천 건.
- 서버와 DB가 없는 정적 사이트입니다. 데이터는 GitHub Actions가 **주 1회** 수집해 저장소의 JSON 파일로 커밋합니다.
- 배포: Cloudflare Workers(정적 자산). `main`에 푸시하면 자동 빌드·배포됩니다. 설정은 `wrangler.jsonc` (프로젝트 이름 `whisky-dex`).
- 구성은 청약맵 기본 구성도 v1(`taezzixo/dash_housing` 의 `docs/ARCHITECTURE.md`)을 따릅니다. 달라진 점은 `docs/ARCHITECTURE.md` §0.
- 저장소는 **비공개**입니다. 그래도 키·토큰·개인정보는 커밋하지 않습니다.
- 기획: `docs/PLAN_ORIGINAL.md`(최초 기획서), `docs/PRD.md`(PRD v1.0). 시드 작성·검수 기준: `docs/SEED_GUIDE.md`.

## 기술 스택과 원칙
- React 18 + TypeScript + Vite. 런타임 의존성은 `react`, `react-dom`뿐입니다. 새 의존성을 추가하기 전에 확인을 받습니다.
- 맛 축·추천 가중치는 `src/config/flavor.ts` 한 곳에만 둡니다. 가중치를 바꾸면 `SIMILARITY_VERSIONS`에 새 버전을 **추가**하고 기존 버전은 지우지 않습니다.
- BTI 문항·점수는 `src/config/bti.ts`. 바꾸면 `BTI_VERSION`을 올립니다.
- 사용자 입력(BTI 답, 시음 기록, 위시리스트, 마셔본 목록, 내 바, 비교함)은 서버로 보내지 않습니다. 바코드 스캔 영상도 기기 안에서만 처리합니다. localStorage에만 두고 JSON 내보내기·가져오기로 옮깁니다.
- 맛 수치·가격 화면에는 "추정치·참고용"과 출처를 항상 둡니다. 판매·구매 연결 기능은 만들지 않습니다(주류 통신판매 규제).
- 디자인 규칙은 `docs/DESIGN_SYSTEM.md`(Figma 연동 포함)를 따릅니다. 방향은 "비뉴 바리끄": 보르도 블랙 바탕, 가넷(`--wine`), 금박(`--gold*`), 유리 패널(`.panel`), 진열 칸 3D 기울기, 마신 위스키는 금색 테두리 + 바깥으로 옅어지는 빛. 토큰은 `styles.css` 맨 위 `:root`(+라이트 두 블록)에만 둡니다. 대문자 라벨, "A · B · C" 메타 문자열, 이모지 아이콘, 모든 블록 카드화는 쓰지 않습니다.
- 차트 색은 `--series-1`, `--series-2`만 씁니다(dataviz 검증 통과: 다크 #BA841A/#16A398, 라이트 #9A6618/#008C80). 버튼 강조색과 섞지 않습니다.
- 위스키 그림은 **자유 라이선스 실제 사진**(Open Food Facts CC BY-SA, 위키미디어 공용 CC BY/BY-SA/CC0/PD)을 쓰고, 사진마다 작성자·라이선스를 표시합니다. 쇼핑몰·브랜드 사이트 이미지는 쓰지 않습니다. 사진이 없으면 잔 일러스트(`Glass.tsx`, 추정 액체 색)를 씁니다.

## 명령
```bash
npm install            # 의존성 설치
npm run sample         # 시드만으로 public/data 샘플 생성 (네트워크 불필요)
npm run dev            # 개발 서버
npm test               # 단위 테스트 (현재 45개, 모두 통과해야 함)
npm run build          # 타입 검사 + 빌드 + 위스키별 SEO 페이지 생성
npm run fetch:data     # 데이터 수집 (키 불필요)
npm run fetch:images   # 실제 사진 수집 (Open Food Facts·위키미디어 공용, 자유 라이선스만)
```
- 프록시 환경에서 수집할 때는 `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`를 함께 씁니다.

## 디렉터리
- `src/App.tsx` — 탭(도감 · 위스키BTI · 맛 지도 · 내 기록 · 비교), 주소(`?tab=`, `?w=<id>` 상세), 데이터 불러오기
- `src/components/` — `Dex.tsx`(액체 색 띠·배지·나라별 수집·선반), `WhiskyDetail.tsx`(상세 + 시음 기록 + 비슷한 위스키 4가지 모드), `Tasting.tsx`(별점·시음 기록 폼), `FlavorMap.tsx`(맛 지도 산점도), `Records.tsx`(내 기록), `HomeBar.tsx`(내 바: 보유 병·남은 양·산화 안내), `Compare.tsx`(최대 4종 비교), `BarcodeScan.tsx`(카메라 바코드), `Bti.tsx`, `WhiskyRow.tsx`(목록 행), `WhiskyArt.tsx`(사진 또는 잔 + 3D 기울기), `Glass.tsx`(잔 일러스트), `Charts.tsx`(레이더·10축 막대)
- `src/lib/` — `similar.ts`(유사도·추천 모드), `bti.ts`, `collection.ts`(수집률·배지·기록 기반 취향·맛 지도 좌표·가상 바 산화 안내·바코드 찾기), `liquid.ts`(액체 색), `pairing.ts`(안주·마시는 법 추정 가이드), `overrides.ts`(수동 보정·검색), `store.ts`(localStorage, 시음 기록)
- `src/config/` — `flavor.ts`(맛 10축·가중치 버전), `bti.ts`(문항·유형 이름)
- `src/admin/main.tsx` + `admin.html` — 관리 페이지 `/admin.html`(읽기 전용: 출처별 수집 결과·품질·이력)
- `data/flavor-seed.json` — **큐레이션 시드**(맛 벡터가 있는 도감의 원본, 345종). 추가·수정 기준은 `docs/SEED_GUIDE.md`
- `scripts/fetch-whiskies.mjs` — 수집 메인. `scripts/sources/`(wikidata · openfoodfacts · iowa · http), `scripts/lib/normalize.mjs`(정규화·병합·Iowa 이름 정리), `scripts/lib/zip.mjs`(Iowa zip 풀기), `scripts/fetch-images.mjs` + `scripts/lib/images.mjs`(실제 사진 찾기·라이선스 확인·브랜드/연수 매칭)
- `scripts/prerender.mjs` — 위스키별 정적 페이지(`/w/<id>`), 사이트맵, robots
- `public/img/w/` — 실제 사진, `data/images.json` — 사진 출처·라이선스·못 찾은 기록(30일 뒤 재시도)
- `public/data/` — `whiskies.json`(도감: 시드 + 바코드·좌표 보강), `catalog.json`(맛 정보 없는 수집 카탈로그), `distilleries.json`, `run-log.json`, `overrides.json`

## 데이터 규칙
- 위스키 `id`는 출처별로 고정입니다(`seed-…`, `wd-Q…`, `off-<바코드>`, `ia-<품목번호>`, `manual-…`). 바꾸면 위시리스트와 링크가 깨집니다.
- 맛 벡터 10축 순서: 단맛, 스모키, 바디, 스파이시, 과일, 꽃, 몰티, 오크, 견과, 셰리. 각 0~5.
- 등급: A 공식·검수 / B 커뮤니티 검증 / C 추정. 시드는 모두 C로 시작하고, 검수한 항목만 올립니다.
- 출처가 실패하거나 갑자기 0건이면 그 출처만 직전 데이터를 유지합니다(`run-log.json`에 기록).
- 숨김·수정·수동 등록은 `public/data/overrides.json`에서 합니다.
- 외부 데이터 원문(리뷰 텍스트, 상품 이미지)은 복제하지 않습니다. Open Food Facts는 ODbL이라 출처 표기를 유지합니다.

## 배포와 커밋
- 브랜치: `main`이 기본 브랜치이자 배포 브랜치입니다(2026-11-14 변경). 작업은 대화별 작업 브랜치(`claude/…`)에서 하고, 테스트·빌드를 통과한 뒤 `main`에 합칩니다(fast-forward). 작업 브랜치가 `main`보다 뒤처지면 먼저 `main`을 받아 맞춥니다.
- `main`에 푸시하면 Cloudflare가 자동 배포합니다(연결은 사람이 한 번 설정, `README.md` 참고).
- 매주 월요일 06:17 KST에 Actions가 데이터를 커밋합니다. 봇 커밋이 "Unverified"로 보여도 정상입니다. 강제 푸시하지 않습니다.
- 커밋 메시지에는 Claude 공동 작성 줄과 `Claude-Session` 줄을 함께 씁니다. 요청하지 않은 PR은 만들지 않습니다.

## 새 대화를 시작할 때 할 일
1. 이 파일을 읽습니다.
2. 인계 문서(Notion 「[위스키 도감] 인계 문서 (새 대화 시작용)」 또는 `docs/HANDOFF.md`)의 "다음 할 일"을 확인합니다.
3. 작업 범위를 한 주제로 정합니다. 주제가 바뀌면 새 대화를 엽니다.
