// 위스키BTI — 문항 화면과 결과 화면.

import { useMemo, useState } from 'react';
import { QUESTIONS } from '../config/bti.ts';
import { buildProfile, recommend, type Answers, type BtiProfile } from '../lib/bti.ts';
import type { Whisky } from '../types.ts';
import { Radar } from './Charts.tsx';
import { WhiskyRow } from './WhiskyRow.tsx';

export function BtiQuiz({ onDone }: { onDone: (p: BtiProfile) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const q = QUESTIONS[step];

  const choose = (i: number) => {
    const next = { ...answers, [q.id]: i };
    setAnswers(next);
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else onDone(buildProfile(next));
  };

  return (
    <div className="stack">
      <section className="hero">
        <h1>나에게 맞는 위스키는</h1>
        <p className="lede">커피, 디저트, 향신료 취향 같은 질문 {QUESTIONS.length}개로 위스키 취향 유형과 첫 세 병을 골라 드립니다.</p>
      </section>
      <section className="quiz panel" aria-labelledby="q-title">
        <div className="quiz-progress" role="progressbar" aria-valuemin={1} aria-valuemax={QUESTIONS.length} aria-valuenow={step + 1} aria-label={`질문 ${step + 1} / ${QUESTIONS.length}`}>
          {QUESTIONS.map((x, i) => (
            <i key={x.id} className={i <= step ? 'on' : undefined} />
          ))}
        </div>
        <p className="muted small num">
          {step + 1} / {QUESTIONS.length}
        </p>
        <h2 id="q-title">{q.title}</h2>
        {q.hint && <p className="muted">{q.hint}</p>}
        <div className="choices">
          {q.choices.map((c, i) => (
            <button key={c.label} className="choice" aria-pressed={answers[q.id] === i} onClick={() => choose(i)}>
              <span className="mark" aria-hidden="true" />
              {c.label}
            </button>
          ))}
        </div>
        {step > 0 && (
          <div>
            <button className="link" onClick={() => setStep(step - 1)}>
              이전 질문
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

interface ResultProps {
  profile: BtiProfile;
  whiskies: Whisky[];
  wishlist: string[];
  tried: Set<string>;
  onWish: (id: string) => void;
  onOpen: (id: string) => void;
  onRetry: () => void;
}

export function BtiResult({ profile, whiskies, wishlist, tried, onWish, onOpen, onRetry }: ResultProps) {
  const { picks, stepUp } = useMemo(() => recommend(profile, whiskies), [profile, whiskies]);
  const [copied, setCopied] = useState('');

  const share = async () => {
    const text = `나의 위스키BTI는 ${profile.name}(${profile.code})\n추천: ${picks.map((p) => p.whisky.nameKo ?? p.whisky.name).join(', ')}\n${location.origin}`;
    try {
      if (!navigator.share) throw new Error('no share');
      await navigator.share({ title: '나의 위스키BTI', text });
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(text);
        setCopied('결과를 복사했습니다. 붙여 넣어 공유하세요.');
      } catch {
        setCopied('이 환경에서는 공유와 복사가 막혀 있습니다.');
      }
    }
  };

  return (
    <div className="stack">
      <section className="type-head">
        <div>
          <p className="code">위스키BTI 결과, 유형 코드 {profile.code}</p>
          <h1>{profile.name}</h1>
          <p className="lede" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--step-1)', color: 'var(--text-2)' }}>
            {profile.desc}
          </p>
          <p className="muted small" style={{ marginTop: 10 }}>
            예산 {profile.budget >= 999 ? '제한 없음' : `${profile.budget}만 원 이하`}
            {profile.highball ? ', 하이볼 선호' : ''}
          </p>
          <div className="row" style={{ marginTop: 18 }}>
            <button className="btn" onClick={share}>
              결과 공유하기
            </button>
            <button className="btn ghost" onClick={onRetry}>
              테스트 다시 하기
            </button>
          </div>
          {copied && (
            <p className="notice" role="status">
              {copied}
            </p>
          )}
        </div>
        <Radar series={[{ label: '내 취향', values: profile.taste }]} />
      </section>

      <section aria-labelledby="picks-title">
        <div className="sec-head">
          <h2 id="picks-title">처음 마셔 볼 세 병</h2>
          <p>예산 안에서 취향에 가장 가까운 순서</p>
        </div>
        <div className="rows">
          {picks.map((p) => (
            <WhiskyRow
              key={p.whisky.id}
              w={p.whisky}
              tried={tried.has(p.whisky.id)}
              score={`적합도 ${Math.round(p.fit * 100)}%`}
              why={p.reason}
              wished={wishlist.includes(p.whisky.id)}
              onWish={() => onWish(p.whisky.id)}
              onOpen={() => onOpen(p.whisky.id)}
            />
          ))}
        </div>
      </section>

      {stepUp && (
        <section aria-labelledby="stepup-title">
          <div className="sec-head">
            <h2 id="stepup-title">예산을 조금 넘긴다면</h2>
          </div>
          <div className="rows">
            <WhiskyRow
              w={stepUp.whisky}
              tried={tried.has(stepUp.whisky.id)}
              score={`적합도 ${Math.round(Math.min(1, stepUp.fit) * 100)}%`}
              why={stepUp.reason}
              wished={wishlist.includes(stepUp.whisky.id)}
              onWish={() => onWish(stepUp.whisky.id)}
              onOpen={() => onOpen(stepUp.whisky.id)}
            />
          </div>
        </section>
      )}
      <p className="muted small">맛 수치와 가격은 추정치이며 참고용입니다. 결과는 이 브라우저에만 저장됩니다.</p>
    </div>
  );
}
