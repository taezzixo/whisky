# API 키 목록 (값 없음)

키 값은 이 저장소, 로그, 채팅, Notion 일반 페이지에 쓰지 않습니다. 원본 값은 Notion 비공개 「위스키 도감 키 보관함」에만 둡니다.

| 이름 | 어디에 | 용도 | 상태 |
|---|---|---|---|
| (없음) | — | 수집 출처(Wikidata, Open Food Facts, Iowa, 위키미디어 공용)는 키가 필요 없음 | — |
| `SITE_URL` | Cloudflare 빌드 변수 | SEO canonical·sitemap 절대 주소 (비밀 아님) | 배포 연결 시 설정 |
| `ANTHROPIC_API_KEY` | GitHub Secrets | (예정·선택) LLM으로 맛 벡터·한국어명 보강. 호출 비용 발생 | 미정 |
| `COLLECTOR_CONTACT` | GitHub 저장소 Variables (선택, 비밀 아님) | 수집기 User-Agent에 넣을 연락처(사이트 주소 등). 위키미디어 공용은 연락처 없는 자동 요청을 강하게 제한함 | 미설정 — 넣지 않기로 함(2026-11-14 사용자 결정) |
| `IOWA_DATASET` | Actions 환경변수 (선택) | Iowa 데이터셋 번호가 바뀌었을 때 덮어쓰기 (비밀 아님) | 기본값 `1029` (idh-be.iowa.gov) |
