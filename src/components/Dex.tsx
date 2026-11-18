// 도감 첫 화면: 액체 색 띠(수집 현황) → 배지 → 나라별 진행 → 선반(전체 도감)

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import NumberFlow from '@number-flow/react';
import { playBand } from '../lib/intro.ts';
import type { ShelfItem } from '../lib/insights.ts';
import { HomeShelf } from './HomeShelf.tsx';
import { hasDutyFree } from '../lib/prices.ts';
import type { Whisky } from '../types.ts';
import { TYPE_LABEL } from '../config/flavor.ts';
import { badgeStates, byCountry, collectionRate } from '../lib/collection.ts';
import { liquidColor, liquidScore } from '../lib/liquid.ts';
import { searchWhiskies } from '../lib/overrides.ts';
import { tiltHandlers, WhiskyArt } from './WhiskyArt.tsx';
import { findByBarcode } from '../lib/collection.ts';
import { BarcodeScan } from './BarcodeScan.tsx';
import { WhiskyRow } from './WhiskyRow.tsx';

interface Props {
  dex: Whisky[];
  catalog: Whisky[] | null;
  tried: Set<string>;
  wishlist: string[];
  onOpen: (id: string) => void;
  onWish: (id: string) => void;
  onNeedCatalog: () => void;
  onStartBti: () => void;
  hasBti: boolean;
  /** 첫 화면 선반 시안용: 최근 마신 병, 다음 잔 추천 */
  shelf?: ShelfItem[];
  pick?: { w: Whisky; reason: string } | null;
}

type Show = 'all' | 'tried' | 'untried' | 'wish';
const PAGE = 72;

/** 첫 화면 시안: ?hero=mosaic (모자이크 칸) | flat (평평한 띠 + 표시) | 없으면 지금 모양 */
type Hero = 'bar' | 'mosaic' | 'flat' | 'shelf';
const heroFromUrl = (): Hero => {
  const h = new URLSearchParams(location.search).get('hero');
  return h === 'mosaic' || h === 'flat' || h === 'shelf' ? h : 'bar';
};
const HERO_COPY: Record<Hero, { title: string; lede: (n: number) => string }> = {
  bar: { title: '마신 위스키는 제 색으로 남습니다', lede: (n) => `위스키 ${n}종을 잔 속 색으로 늘어놓았습니다. 한 잔을 기록할 때마다 그 색에 불이 들어옵니다.` },
  mosaic: { title: '오늘 마신 한 잔이 도감의 한 칸이 됩니다', lede: (n) => `위스키 ${n}종을 옅은 색부터 짙은 색까지 한 칸씩 놓았습니다. 시음을 기록하면 그 칸이 제 색으로 채워집니다.` },
  shelf: { title: '마신 위스키가 내 바 선반에 쌓입니다', lede: (n) => `최근에 마신 병이 선반에 놓이고, 지금까지의 기록으로 다음 잔을 골라 드립니다. 도감에는 위스키 ${n}종이 있습니다.` },
  flat: { title: '마셔 본 만큼 색이 켜집니다', lede: (n) => `위스키 ${n}종을 잔 속 색 순서로 이었습니다. 기록한 위스키 자리에 불이 켜지고 아래에 표시가 남습니다.` },
};

export function Dex({ dex, catalog, tried, wishlist, onOpen, onWish, onNeedCatalog, onStartBti, hasBti, shelf, pick }: Props) {
  const [q, setQ] = useState('');
  const [show, setShow] = useState<Show>('all');
  const [country, setCountry] = useState('');
  const [type, setType] = useState('');
  const [where, setWhere] = useState<'' | 'dutyfree' | 'tronly'>('');
  const [limit, setLimit] = useState(PAGE);
  const [withCatalog, setWithCatalog] = useState(false);

  const rate = collectionRate(dex, tried);
  const triedList = useMemo(() => dex.filter((w) => tried.has(w.id)), [dex, tried]);
  const seals = useMemo(() => badgeStates(triedList), [triedList]);
  const countries = useMemo(() => byCountry(dex, tried), [dex, tried]);
  const bandRef = useRef<HTMLDivElement>(null);
  const [hero] = useState<Hero>(heroFromUrl);
  const band = useMemo(() => [...dex].sort((a, b) => liquidScore(a) - liquidScore(b) || a.id.localeCompare(b.id)), [dex]);

  const filtered = useMemo(() => {
    // 기본 순서: 병 사진이 있는 위스키를 앞에(진열장이 사진으로 채워 보이게), 그다음 이름순
    let list = q ? searchWhiskies(dex, q, 1000) : [...dex].sort((a, b) => Number(!a.image) - Number(!b.image) || (a.nameKo ?? a.name).localeCompare(b.nameKo ?? b.name, 'ko'));
    if (show === 'tried') list = list.filter((w) => tried.has(w.id));
    if (show === 'untried') list = list.filter((w) => !tried.has(w.id));
    if (show === 'wish') list = list.filter((w) => wishlist.includes(w.id));
    if (country) list = list.filter((w) => w.country === country);
    if (type) list = list.filter((w) => w.type === type);
    if (where === 'dutyfree') list = list.filter(hasDutyFree);
    if (where === 'tronly') list = list.filter((w) => w.trOnly);
    return list;
  }, [dex, q, show, country, type, where, tried, wishlist]);
  const barcodeHit = useMemo(() => (/^\d{8,14}$/.test(q.trim()) ? findByBarcode([...dex, ...(catalog ?? [])], q.trim()) : undefined), [q, dex, catalog]);
  const catalogHits = useMemo(() => (withCatalog && q && catalog ? searchWhiskies(catalog, q, 40) : []), [withCatalog, q, catalog]);

  useLayoutEffect(() => {
    if (band.length) playBand(bandRef.current);
  }, [band.length]);

  return (
    <div className="stack">
      <section className="hero" aria-labelledby="dex-title">
        <h1 id="dex-title">{HERO_COPY[hero].title}</h1>
        <p className="lede">{HERO_COPY[hero].lede(rate.total)}</p>
        {hero === 'shelf' ? (
          <HomeShelf shelf={shelf ?? []} pick={pick ?? null} onOpen={onOpen} />
        ) : (
        <>
        <div className="band-stage">
        <div
          ref={bandRef}
          className={hero === 'mosaic' ? 'mosaic' : hero === 'flat' ? 'band flat' : 'band'}
          role="img"
          aria-label={`도감 ${rate.total}종 중 ${rate.done}종 기록. 옅은 색부터 짙은 색 순서.`}
          onClick={(e) => {
            const id = (e.target as HTMLElement).dataset.id;
            if (id) onOpen(id);
          }}
        >
          {band.map((w, i) => (
            <span
              key={w.id}
              data-id={w.id}
              className={tried.has(w.id) ? 'on' : undefined}
              style={{ background: liquidColor(w) }}
              title={`${w.nameKo ?? w.name}${tried.has(w.id) ? ' (기록함)' : ''}`}
            />
          ))}
        </div>
        {hero === 'flat' && (
          <div className="band-marks" aria-hidden="true">
            {band.map((w, i) => (tried.has(w.id) ? <i key={w.id} style={{ left: `${((i + 0.5) / band.length) * 100}%` }} /> : null))}
          </div>
        )}
        </div>
        <div className="band-legend">
          <span>볏짚색, 버번 캐스크</span>
          <span>마호가니, 셰리 캐스크·장기 숙성</span>
        </div>
        </>
        )}
        <div className="progress-line">
          <p>
            <strong className="num">
              <NumberFlow value={rate.done} />
            </strong>{' '}
            / <NumberFlow value={rate.total} />종 기록, 수집률 <NumberFlow value={rate.pct} format={{ maximumFractionDigits: 1 }} suffix="%" />
          </p>
          {!hasBti && (
            <button className="link" onClick={onStartBti}>
              어디서 시작할지 모르겠다면 위스키BTI부터
            </button>
          )}
        </div>
      </section>

      <section aria-labelledby="seal-title">
        <div className="sec-head">
          <h2 id="seal-title">배지</h2>
          <p>{seals.filter((s) => s.earned).length}개 획득</p>
        </div>
        <div className="seals panel">
          {seals.map(({ badge, count, earned }) => (
            <div key={badge.id} className={`seal${earned ? ' earned' : ''}`}>
              <span className="coin" aria-hidden="true">
                {badge.name.slice(0, 1)}
              </span>
              <div>
                <b>{badge.name}</b>
                <span>
                  {earned ? badge.rule : `${badge.rule}, ${count}/${badge.target}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="country-title">
        <div className="sec-head">
          <h2 id="country-title">나라별 수집</h2>
        </div>
        <div className="countries panel">
          {countries.slice(0, 8).map((c) => (
            <div key={c.country} className="country">
              <span>{c.country}</span>
              <span className="num muted">
                {c.done}/{c.total}
              </span>
              <span className="bar" role="img" aria-label={`${c.country} ${c.done}/${c.total}`}>
                <i style={{ width: `${(c.done / c.total) * 100}%` }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="shelf-title">
        <div className="sec-head">
          <h2 id="shelf-title">전체 도감</h2>
          <p>{filtered.length}종</p>
        </div>
        <div className="toolbar">
          <input
            id="dex-search"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
              if (/^\d{8,}$/.test(e.target.value.trim())) onNeedCatalog();
            }}
            placeholder="이름, 증류소, 향, 바코드 숫자로 찾기 (예: 맥캘란, 아일라)"
            aria-label="도감 검색"
          />
          <BarcodeScan
            onCode={(code) => {
              setQ(code);
              onNeedCatalog();
            }}
          />
          <select id="dex-country" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="나라">
            <option value="">모든 나라</option>
            {countries.map((c) => (
              <option key={c.country} value={c.country}>
                {c.country}
              </option>
            ))}
          </select>
          <select id="dex-type" value={type} onChange={(e) => setType(e.target.value)} aria-label="종류">
            <option value="">모든 종류</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select id="dex-where" value={where} onChange={(e) => setWhere(e.target.value as typeof where)} aria-label="살 수 있는 곳">
            <option value="">모든 판매처</option>
            <option value="dutyfree">면세점에서 살 수 있는</option>
            <option value="tronly">면세점 전용</option>
          </select>
        </div>
        <div className="chips" style={{ marginTop: 10 }}>
          {(
            [
              ['all', '전체'],
              ['tried', '마신 위스키'],
              ['untried', '아직 못 마신 위스키'],
              ['wish', '위시리스트'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className="chip" aria-pressed={show === k} onClick={() => setShow(k)}>
              {label}
            </button>
          ))}
        </div>

        {barcodeHit && (
          <div className="rows" style={{ marginTop: 14 }}>
            <p className="small muted">바코드 {q.trim()}에 맞는 위스키</p>
            <WhiskyRow w={barcodeHit} tried={tried.has(barcodeHit.id)} wished={wishlist.includes(barcodeHit.id)} onWish={() => onWish(barcodeHit.id)} onOpen={() => onOpen(barcodeHit.id)} />
          </div>
        )}
        {/^\d{8,14}$/.test(q.trim()) && !barcodeHit && (
          <p className="muted small" style={{ marginTop: 14 }}>
            {catalog === null ? '수집 카탈로그까지 찾는 중입니다.' : `바코드 ${q.trim()}에 맞는 위스키가 아직 없습니다.`}
          </p>
        )}
        {filtered.length === 0 && !/^\d{8,14}$/.test(q.trim()) ? (
          <p className="muted" style={{ marginTop: 20 }}>
            조건에 맞는 위스키가 도감에 없습니다. 검색어를 줄이거나 아래 수집 카탈로그를 함께 찾아보세요.
          </p>
        ) : filtered.length === 0 ? null : (
          <div className="cabinet" style={{ marginTop: 16 }}>
            {filtered.slice(0, limit).map((w) => {
              const on = tried.has(w.id);
              return (
                <button key={w.id} className={`slot ${on ? 'tried' : 'untried'}`} onClick={() => onOpen(w.id)} {...tiltHandlers()} aria-label={`${w.nameKo ?? w.name}${on ? ', 마신 위스키' : ''}`}>
                  <span className="art">
                    <WhiskyArt w={w} height={140} tried={on} />
                  </span>
                  <span className="meta">
                    <span className="nm">{w.nameKo ?? w.name}</span>
                    <span className="sub">{w.country}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {filtered.length > limit && (
          <button className="btn ghost more" onClick={() => setLimit(limit + PAGE * 2)}>
            {Math.min(PAGE * 2, filtered.length - limit)}종 더 보기
          </button>
        )}

        {q && (
          <div style={{ marginTop: 28 }}>
            <label className="small">
              <input
                type="checkbox"
                checked={withCatalog}
                onChange={(e) => {
                  setWithCatalog(e.target.checked);
                  if (e.target.checked) onNeedCatalog();
                }}
              />{' '}
              수집 카탈로그({catalog ? `${catalog.length.toLocaleString()}건` : '불러오기'})에서도 찾기, 맛 정보가 아직 없는 제품입니다
            </label>
            {withCatalog && (
              <div className="rows" style={{ marginTop: 8 }}>
                {catalog === null && <p className="muted small">불러오는 중</p>}
                {catalogHits.map((w) => (
                  <WhiskyRow key={w.id} w={w} tried={tried.has(w.id)} wished={wishlist.includes(w.id)} onWish={() => onWish(w.id)} onOpen={() => onOpen(w.id)} />
                ))}
                {catalog && catalogHits.length === 0 && <p className="muted small">카탈로그에도 없습니다.</p>}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
