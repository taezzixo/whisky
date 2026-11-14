// 관리자 페이지(읽기 전용): 수집 현황·품질·도감 등급. 수정은 저장소 파일(overrides.json, flavor-seed.json)로 한다.
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { WhiskiesFile } from '../types.ts';
import '../styles.css';

interface SourceRun { id: string; ok: boolean; count: number; error?: string; sec?: number }
interface RunEntry { runAt: string; durationSec: number; sources: SourceRun[]; quality: { dex: Record<string, number>; catalog: Record<string, number> } }
interface RunLog { last: RunEntry | null; history: RunEntry[] }

const SRC = { wikidata: 'Wikidata 증류소', off: 'Open Food Facts', iowa: '아이오와 주류청', seed: '큐레이션 시드' } as Record<string, string>;
const BASE = import.meta.env.BASE_URL;
const get = <T,>(p: string) => fetch(`${BASE}data/${p}`).then((r) => (r.ok ? (r.json() as Promise<T>) : null)).catch(() => null);

function Admin() {
  const [log, setLog] = useState<RunLog | null>(null);
  const [dex, setDex] = useState<WhiskiesFile | null>(null);
  useEffect(() => {
    get<RunLog>('run-log.json').then(setLog);
    get<WhiskiesFile>('whiskies.json').then(setDex);
  }, []);
  const last = log?.last;
  const w = dex?.whiskies ?? [];
  const grades = { A: 0, B: 0, C: 0 } as Record<string, number>;
  w.forEach((x) => (grades[x.grade] = (grades[x.grade] ?? 0) + 1));

  return (
    <div className="app">
      <header className="top">
        <a className="wordmark" href={`${BASE}`} style={{ textDecoration: 'none' }}>위스키 도감</a>
        <span className="muted small">관리 (읽기 전용)</span>
      </header>
      <main className="stack">
        <section className="hero">
          <h1>수집 현황</h1>
          <p className="lede">
            {last ? `마지막 수집 ${new Date(last.runAt).toLocaleString('ko-KR')}, ${last.durationSec}초 걸림.` : '아직 수집 기록이 없습니다. GitHub Actions에서 "위스키 데이터 수집"을 실행하세요.'}
          </p>
        </section>
        {last && (
          <section>
            <h2>출처별 결과</h2>
            <div className="rows" style={{ marginTop: 10 }}>
              {last.sources.map((s) => (
                <div key={s.id} className="wrow" style={{ gridTemplateColumns: '1fr auto' }}>
                  <div>
                    <h4>{SRC[s.id] ?? s.id}</h4>
                    {s.error && <span className="why" style={{ color: 'var(--warn)' }}>실패: {s.error}. 직전 데이터를 유지했습니다.</span>}
                  </div>
                  <div className="side">
                    <span className="score">{s.ok ? '성공' : '실패'}</span>
                    <span className="num">{s.count.toLocaleString()}건{s.sec != null ? `, ${s.sec}초` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        <section>
          <h2>도감 품질</h2>
          <dl className="facts" style={{ fontSize: 'var(--step-0)' }}>
            <dt>도감(맛 정보 있음)</dt>
            <dd className="num">{w.length}종, 등급 A {grades.A} / B {grades.B} / C {grades.C}</dd>
            <dt>증류소 좌표 연결</dt>
            <dd className="num">{w.filter((x) => x.lat != null).length}종</dd>
            <dt>바코드 연결</dt>
            <dd className="num">{w.filter((x) => x.barcode?.length).length}종</dd>
            {last && (
              <>
                <dt>수집 카탈로그</dt>
                <dd className="num">
                  {last.quality.catalog.total?.toLocaleString()}건, 도수 없음 {last.quality.catalog.noAbv}, 나라 없음 {last.quality.catalog.noCountry}
                </dd>
              </>
            )}
          </dl>
          <p className="muted small" style={{ marginTop: 12 }}>
            숨기기·수정·수동 등록은 저장소의 public/data/overrides.json, 맛 수치는 data/flavor-seed.json에서 합니다(docs/SEED_GUIDE.md).
          </p>
        </section>
        {log && log.history.length > 1 && (
          <section>
            <h2>최근 수집 기록</h2>
            <table className="flavor-bars" style={{ marginTop: 10 }}>
              <tbody>
                {log.history.slice(0, 12).map((h) => (
                  <tr key={h.runAt}>
                    <th scope="row" className="num">{h.runAt.slice(0, 16).replace('T', ' ')}</th>
                    <td>{h.sources.map((s) => `${SRC[s.id] ?? s.id} ${s.ok ? s.count.toLocaleString() : '실패'}`).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Admin />
  </StrictMode>,
);
