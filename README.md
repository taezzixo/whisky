# 위스키 도감 (whisky-dex)

위스키 취향 테스트(위스키BTI)로 내 취향 유형과 추천 위스키를 찾고, 좋아하는 위스키와 비슷한 위스키를 추천받는 사이트입니다.

## 기능 (v0.1)
- **위스키BTI:** 커피·디저트·향신료 취향 등 8개 질문 → 16개 유형 중 하나 + 예산 안 추천 Top 3 + "한 단계 위" 1개. 결과 공유.
- **비슷한 위스키 추천:** 위스키 상세에서 4가지 모드 — 비슷한 / 더 저렴한 대체 / 한 단계 위 / 한 축만 바꾸기(예: 더 스모키하게). 카드마다 공통점·차이점을 보여 주고, 레이더 차트에 겹쳐 비교할 수 있습니다.
- **찾아보기:** 한글·영문 검색. 도감(맛 정보 있음) + 수집 카탈로그(맛 정보 준비 중).
- **내 목록:** 위시리스트, 마셔본 위스키. 브라우저에만 저장, JSON 내보내기·가져오기.
- **SEO:** 위스키별 정적 페이지 `/w/<id>`, `sitemap.xml`.

## 아키텍처 (서버·DB 없음)
```
GitHub Actions (매주 월 06:17 KST)
  Wikidata · Open Food Facts · Iowa 주류 제품 목록 ─▶ scripts/fetch-whiskies.mjs
      ─▶ 정규화 · 시드와 병합(바코드·증류소 좌표) · 0건 가드 · 품질 점검
      ─▶ public/data/*.json 커밋
                      │ (main 푸시)
                      ▼
Cloudflare Workers 정적 자산 자동 빌드·배포 + /w/<id> SEO 페이지
                      │
브라우저: BTI 계산 · 유사도 계산 · 차트 · localStorage  ← 모두 클라이언트
```
자세한 내용: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 설정
1. **GitHub Secrets:** v0.1은 필요 없습니다(모든 출처가 키 없음). 목록은 [docs/API_KEYS.md](docs/API_KEYS.md).
2. **Cloudflare 배포 (Workers 정적 자산):** 대시보드 → Workers 및 Pages → 만들기 → Git 저장소 가져오기 → `taezzixo/whisky` 선택(비공개 저장소는 Cloudflare GitHub 앱에 이 저장소 접근 권한이 필요합니다).
   - 프로젝트 이름 `whisky-dex`, 프로덕션 브랜치 `main`
   - 빌드 명령 `npm run build`, 배포 명령 `npx wrangler deploy`
   - 빌드 변수: `SITE_URL` = 배포 주소 (예: `https://whisky-dex.<계정>.workers.dev`)
3. **첫 수집:** GitHub → Actions → "위스키 데이터 수집" → Run workflow. 이후 매주 자동 실행됩니다.

## 로컬 개발
```bash
npm install
npm run sample
npm run dev
```
- 테스트: `npm test` (추천·BTI·저장·수집 파서)
- 위스키 추가·맛 수치 수정: `data/flavor-seed.json` 편집 후 `npm run sample`

## 데이터 출처와 이용 조건
| 출처 | 쓰는 것 | 조건 |
|---|---|---|
| 큐레이션 시드 (`data/flavor-seed.json`) | 맛 벡터·태그·요약 (추정치) | 자체 작성 |
| Wikidata | 위스키 증류소·좌표 | CC0 |
| Open Food Facts | 바코드·제품명·도수 | ODbL — 출처 표기 |
| Iowa Alcoholic Beverages Division (data.iowa.gov) | 미국 유통 위스키 SKU·도수·UPC | 공공 데이터 |

만 19세 이상을 위한 정보 서비스이며 주류를 판매하거나 중개하지 않습니다.
