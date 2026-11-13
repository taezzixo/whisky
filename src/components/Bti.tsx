// 위스키BTI — 문항 화면과 결과 화면.

import { useMemo, useState } from 'react';
import { QUESTIONS } from '../config/bti.ts';
import { buildProfile, recommend, type Answers, type BtiProfile } from '../lib/bti.ts';
import type { Whisky } from '../types.ts';
import { Radar } from './Charts.tsx';
import { WhiskyCard } from './WhiskyCard.tsx';

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
    <section className="quiz card">
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={step + 1}>
        <span style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
      </div>
      <p className="eyebrow">
        질문 {step + 1} / {QUESTIONS.length}
      </p>
      <h2>{q.title}</h2>
      {q.hint && <p className="muted">{q.hint}</p>}
      <div className="choices">
        {q.choices.map((c, i) => (
          <button key={c.label} className={`choice${answers[q.id] === i ? ' on' : ''}`} onClick={() => choose(i)}>
            <span className="emoji" aria-hidden="true">
              {c.emoji}
            </span>
            {c.label}
          </button>
        ))}
      </div>
      {step > 0 && (
        <button className="link" onClick={() => setStep(step - 1)}>
          ← 이전 질문
        </button>
      )}
    </section>
  );
}

interface ResultProps {
  profile: BtiProfile;
  whiskies: Whisky[];
  wishlist: string[];
  onWish: (id: string) => void;
  onOpen: (id: string) => void;
  onRetry: () => void;
}

export function BtiResult({ profile, whiskies, wishlist, onWish, onOpen, onRetry }: ResultProps) {
  const { picks, stepUp } = useMemo(() => recommend(profile, whiskies), [profile, whiskies]);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = `나의 위스키BTI는 ${profile.emoji} ${profile.name} (${profile.code})!\n추천: ${picks.map((p) => p.whisky.nameKo ?? p.whisky.name).join(', ')}\n${location.origin}`;
    try {
      if (navigator.share) await navigator.share({ title: '나의 위스키BTI', text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
      }
    } catch {
      /* 공유 취소 */
    }
  };

  return (
    <section className="result">
      <div className="card type-card">
        <p className="eyebrow">나의 위스키BTI · {profile.code}</p>
        <h2>
          <span aria-hidden="true">{profile.emoji}</span> {profile.name}
        </h2>
        <p>{profile.desc}</p>
        <Radar series={[{ label: '내 취향', values: profile.taste }]} />
        <p className="muted small">
          예산 {profile.budget >= 999 ? '제한 없음' : `${profile.budget}만 원 이하`}
          {profile.highball ? ' · 하이볼 선호' : ''}
        </p>
        <div className="row">
          <button className="btn" onClick={share}>
            {copied ? '복사했어요' : '결과 공유하기'}
          </button>
          <button className="btn ghost" onClick={onRetry}>
            다시 하기
          </button>
        </div>
      </div>

      <h3>내 취향에 맞는 위스키 Top {picks.length}</h3>
      <div className="grid">
        {picks.map((p, i) => (
          <WhiskyCard
            key={p.whisky.id}
            w={p.whisky}
            badge={`${i + 1}위 · 적합도 ${Math.round(p.fit * 100)}%`}
            note={p.reason}
            wished={wishlist.includes(p.whisky.id)}
            onWish={() => onWish(p.whisky.id)}
            onOpen={() => onOpen(p.whisky.id)}
          />
        ))}
      </div>
      {stepUp && (
        <>
          <h3>예산을 조금 넘기면 · 한 단계 위</h3>
          <div className="grid">
            <WhiskyCard
              w={stepUp.whisky}
              badge={`적합도 ${Math.round(Math.min(1, stepUp.fit) * 100)}%`}
              note={stepUp.reason}
              wished={wishlist.includes(stepUp.whisky.id)}
              onWish={() => onWish(stepUp.whisky.id)}
              onOpen={() => onOpen(stepUp.whisky.id)}
            />
          </div>
        </>
      )}
      <p className="muted small">맛 수치와 가격은 추정치이며 참고용입니다. 결과는 이 브라우저에만 저장됩니다.</p>
    </section>
  );
}
