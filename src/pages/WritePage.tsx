import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react';
import { shuffleArray, checkWrittenAnswer } from '../utils';
import { saveLastMode } from './FlashcardPage';
import ImageZoom from '../components/ui/ImageZoom';
import type { CardSet } from '../types';

interface WritePageProps {
  cardSets: CardSet[];
  onUpdateStat: (cardId: string, isCorrect: boolean) => Promise<void>;
}

export default function WritePage({ cardSets, onUpdateStat }: WritePageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const set = cardSets.find(s => s.id === id);

  if (id) saveLastMode(id, 'write');

  const [cards] = useState(() => set ? shuffleArray([...set.cards]) : []);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!set || cards.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ color: 'var(--text-2)', marginBottom: 16 }}>카드가 없습니다.</p>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>돌아가기</button>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / cards.length) * 100);
    return (
      <div style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: pct >= 70 ? 'var(--green-bg)' : 'var(--blue-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Trophy size={32} color={pct >= 70 ? 'var(--green)' : 'var(--blue)'} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>완료!</h2>
        <p style={{ color: 'var(--text-2)', marginBottom: 20 }}>{cards.length}문제 중 {score}개 정답</p>
        <div className="stat-card" style={{ marginBottom: 24 }}>
          <div className="stat-value" style={{ color: pct >= 70 ? 'var(--green)' : 'var(--blue)' }}>{pct}%</div>
          <div className="stat-label">정답률</div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-md" onClick={() => { setIdx(0); setInput(''); setSubmitted(false); setScore(0); setFinished(false); }}>
            <RotateCcw size={15} /> 다시
          </button>
          <button className="btn btn-primary btn-md" onClick={() => navigate(`/set/${id}`)}>세트로</button>
        </div>
      </div>
    );
  }

  const card = cards[idx];

  const submit = async () => {
    const isCorrect = checkWrittenAnswer(input, card.definition);
    setCorrect(isCorrect);
    setSubmitted(true);
    if (isCorrect) setScore(s => s + 1);
    await onUpdateStat(card.id, isCorrect);
  };

  const next = () => {
    if (idx + 1 >= cards.length) { setFinished(true); return; }
    setIdx(i => i + 1); setInput(''); setSubmitted(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/set/${id}`)} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> {set.title}
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{idx + 1} / {cards.length}</span>
      </div>

      <div className="progress-track" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${(idx / cards.length) * 100}%` }} />
      </div>

      <div className="card card-glow" style={{ padding: 28, marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>용어</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, lineHeight: 1.4 }}>{card.term}</h2>
        {card.imageUrl && <ImageZoom src={card.imageUrl} style={{ maxHeight: 120, borderRadius: 8, marginBottom: 16, objectFit: 'contain' }} />}
        {card.hint && <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>힌트: {card.hint}</p>}

        <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>정의를 입력하세요:</p>
        <textarea className="input" rows={3} placeholder="여기에 정의를 입력..." value={input}
          onChange={e => setInput(e.target.value)} disabled={submitted} autoFocus />

        {submitted && (
          <div className={`alert ${correct ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 12 }}>
            {correct ? <CheckCircle size={15} /> : <XCircle size={15} />}
            <div>
              <div style={{ fontWeight: 700 }}>{correct ? '정답!' : '틀렸습니다.'}</div>
              {!correct && <div style={{ fontSize: 13, marginTop: 2 }}>정답: {card.definition}</div>}
            </div>
          </div>
        )}
      </div>

      {!submitted
        ? <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={submit} disabled={!input.trim()}>제출</button>
        : <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={next}>{idx + 1 >= cards.length ? '결과 보기' : '다음'} →</button>
      }
    </div>
  );
}
