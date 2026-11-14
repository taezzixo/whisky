# 위스키 도감 인계 문서 (새 대화 시작용)

> Notion 「대시보드 v1.0 / [위스키 도감] (whisky) / [위스키 도감] 인계 문서 (새 대화 시작용)」의 저장소 사본입니다. 이후에는 Notion을 기준으로 갱신하고, 바뀌면 이 파일도 맞춥니다.
> 마지막 갱신: 2026-11-14 (기본 브랜치 `main` 변경 후)

## 현재 상태 — v0.1 (기본·배포 브랜치 `main`)
- 기획: `docs/PLAN_ORIGINAL.md`(최초 기획서), `docs/PRD.md`(PRD v1.0)
- 구성: 청약맵 기본 구성도 v1 적용. 달라진 점은 `docs/ARCHITECTURE.md` §0 (2026-11-13 사용자 확인)
- 화면: 위스키BTI(8문항 → 16유형 → Top 3 + 한 단계 위), 찾아보기, 위스키 상세 + 비슷한 위스키 4가지 모드, 내 목록(위시·마셔본, JSON 내보내기·가져오기)
- 데이터: 큐레이션 시드 84종(맛 벡터 추정, 등급 C) + 수집 카탈로그 3,195건(맛 정보 없음, 검색 전용) + 증류소 327곳
  - 2026-11-14 수집: Wikidata 327 · Open Food Facts 683 · Iowa 3,285 — 모두 성공. 시드 중 56종에 증류소 좌표, 30종에 바코드 연결
  - 첫 Actions 실행에서 OFF 0건·Iowa 404 → 수정함: OFF 카테고리 태그는 `whisky`(단수), `nutriments` 필드는 503 유발이라 제외 / Iowa는 새 API `idh-be.iowa.gov` 데이터셋 1029(zip 안 줄 단위 JSON)
- 배포: https://whisky-dex.kth95280.workers.dev — 첫 연결 때 한 번만 배포됨(샘플 데이터). **이후 푸시가 자동 배포되지 않는 문제가 있음** (아래 "다음 할 일 (사람)" 1번)
- 브랜치: 2026-11-14 `main`을 만들고 GitHub 기본 브랜치를 `main`으로 변경(사용자 승인). 작업 브랜치에서 작업 → 테스트·빌드 통과 → `main`에 합침. 청약맵 저장소와는 무관한 저장소별 설정
- 테스트 32개 통과, 빌드 성공, 라이트·다크·모바일 화면 확인
- MVP 미리보기(비공개): https://claude.ai/artifact/PgGBdwZvZWRZ9MG5Ps9VkW — 정식 배포 전 확인용. 이 미리보기에서는 JSON 내보내기가 동작하지 않음

## 결정된 사항
| 항목 | 결정 |
|---|---|
| 저장소 | `taezzixo/whisky` 비공개 유지 |
| 데이터 출처 | 무료 공개 3종 + 맛 시드 (LLM 보강은 보류) |
| v0.1 화면 | 위스키BTI + 유사 추천 |
| 계정 | 없음, localStorage + JSON 내보내기 |
| 수집 주기 | 주 1회 (월 06:17 KST) |

## 다음 할 일 (사람)
1. Cloudflare 자동 배포 확인 (대시보드 → Workers 및 Pages → `whisky-dex`)
   - 배포(Deployments) 탭에 2026-11-14 이후 빌드 기록이 있는지. 실패면 빌드 로그를 Claude에게 전달
   - 설정 → 빌드: Git 저장소 `taezzixo/whisky` 연결 여부, 운영 브랜치 `main`, 빌드 `npm run build`, 배포 `npx wrangler deploy`
   - 저장소가 목록에 없으면 GitHub → Settings → Applications → Cloudflare 앱에 `whisky` 저장소 접근 권한 추가
2. Cloudflare 빌드 변수 `SITE_URL=https://whisky-dex.kth95280.workers.dev` 확인 (SEO canonical·sitemap 절대 주소용)

## 다음 할 일 (Claude)
1. 다음 주간 수집(월 06:17 KST) 결과 확인 — OFF는 요청 제한(503)이 잦아 재시도 대기가 길어질 수 있음
2. Iowa 이름의 판매처 약어(예: "Bp", "Ha", "Rclr") 정리 규칙 추가
3. 시드 확대: 국내 유통 인기 위스키 84 → 300종, 맛 벡터 검수 기준 정하기
4. v0.2: 맛 지도(산점도), 도감 그리드·수집률, 관리자 페이지(수집 현황·품질)

## 결정 대기
- LLM(Claude API)으로 카탈로그 항목 맛 벡터 자동 생성할지 — 비용·정확도 검토 필요
- 참고 가격 출처 (현재 추정치) — 제휴 피드 또는 수동 관리
- 도메인 구매 여부

## Notion 업로드 기록
| 날짜 | 문서 | Notion 페이지 (「대시보드 v1.0 / [위스키 도감] (whisky)」 아래) |
|---|---|---|
| 2026-11-14 | 최초 기획서 (`docs/PLAN_ORIGINAL.md`) | [위스키 도감] 기획서 |
| 2026-11-14 | PRD v1.0 (`docs/PRD.md`) | [위스키 도감] PRD v1.0 |
| 2026-11-14 | 시스템 구성도 (`docs/ARCHITECTURE.md`) | [위스키 도감] 시스템 구성도 |
| 2026-11-14 | 인계 문서 (이 파일) | [위스키 도감] 인계 문서 (새 대화 시작용) |

- 2026-11-13에는 Notion 커넥터가 502·503 오류로 연결되지 않아 업로드가 하루 늦어졌습니다.
