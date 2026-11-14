# 위스키 도감 (whisky-dex)

마신 위스키를 잔 속 색으로 모으는 도감입니다. 시음을 기록하고, 위스키BTI로 취향을 찾고, 비슷한 위스키를 추천받습니다.

## 기능 (v0.3)
- **도감:** 위스키 345종을 잔 속 색(캐스크·숙성으로 추정)으로 늘어놓은 색 띠, 수집률, 배지 12종, 나라별 수집 현황, 선반 형태의 전체 목록(마신 위스키는 채운 잔, 아직 못 마신 위스키는 빈 잔). 검색 시 수집 카탈로그 약 3천 건도 함께 찾기.
- **시음 기록:** 위스키 상세에서 별점(0.5 단위)·날짜·마신 방법·메모 기록. 기록하면 잔이 채워지고 배지·수집률이 갱신됩니다.
- **내 기록:** 별점 기반 취향 레이더(위스키BTI 결과와 겹쳐 보기), 시음 일지, 위시리스트, 파일 내보내기·가져오기.
- **맛 지도:** 바디(가벼움↔묵직함) × 부드러움·과일↔스모키 산점도. 나라·피트·마신 위스키로 거르기, 내 취향 위치 표시.
- **위스키BTI:** 8문항 → 16유형 + 예산 안 추천 3종 + 한 단계 위 1종. 결과 공유.
- **비슷한 위스키:** 비슷한 / 더 저렴한 대체 / 한 단계 위 / 한 가지 맛만 바꾸기. 공통점·차이점 표시, 레이더에 겹쳐 비교.
- **실제 사진:** 자유 라이선스 사진(Open Food Facts CC BY-SA, 위키미디어 공용)만 사용, 작성자·라이선스 표시. 없으면 잔 일러스트.
- **비교:** 최대 4종을 레이더·표로 나란히.
- **내 바:** 집에 있는 병의 상태·남은 양·개봉일, 산화 안내(빨리 마셔야 할 병).
- **어울리는 안주·마시는 법:** 맛 수치로 만든 추정 가이드.
- **바코드로 찾기:** 숫자 입력 또는 카메라 스캔(지원 브라우저).
- **관리 페이지:** `/admin.html` — 출처별 수집 결과, 데이터 품질, 최근 수집 이력(읽기 전용).
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
- 디자인 규칙: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- 위스키 추가·맛 수치 수정: `data/flavor-seed.json` 편집 후 `npm run sample` (기준: `docs/SEED_GUIDE.md`)

## 데이터 출처와 이용 조건
| 출처 | 쓰는 것 | 조건 |
|---|---|---|
| 큐레이션 시드 (`data/flavor-seed.json`) | 맛 벡터·태그·요약 (추정치) | 자체 작성 |
| Wikidata | 위스키 증류소·좌표 | CC0 |
| Open Food Facts | 바코드·제품명·도수 | ODbL — 출처 표기 |
| Iowa Alcoholic Beverages Division (data.iowa.gov) | 미국 유통 위스키 SKU·도수·UPC | 공공 데이터 |
| Open Food Facts 제품 사진 | 위스키 병 사진 | CC BY-SA 3.0 — 작성자 표시 |
| 위키미디어 공용 | 위스키 병 사진 | CC BY / CC BY-SA / CC0 / 퍼블릭 도메인만 — 작성자·라이선스 표시 |

만 19세 이상을 위한 정보 서비스이며 주류를 판매하거나 중개하지 않습니다.
