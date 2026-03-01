import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Zap, PenLine, Shuffle, ArrowRight, Brain, ChevronLeft, ChevronRight, RotateCcw, Flame, RefreshCw, X } from 'lucide-react';
import InfoTooltip from '../components/ui/InfoTooltip';
import { loadProgress, loadLastMode, loadCompleted } from './FlashcardPage';
import { loadTestProgress, loadTestCompleted } from './TestPage';
import { loadLearnProgress, loadLearnCompleted } from './LearnPage';
import { loadStreak } from '../utils/streak';
import { loadAllSessions } from '../hooks/useStudySync';
import type { CardSet, CardStat, Folder } from '../types';

// 모드 → 경로/라벨/색상 매핑
const MODE_META = {
  flashcard: { label: '플래시카드', color: 'var(--blue)', path: (id: string) => `/flashcard/${id}` },
  learn:     { label: '학습하기',   color: 'var(--purple)', path: (id: string) => `/learn/${id}` },
  test:      { label: '테스트',     color: 'var(--green)', path: (id: string) => `/test/${id}` },
  match:     { label: '매칭',       color: 'var(--yellow)', path: (id: string) => `/match/${id}` },
  write:     { label: '쓰기',       color: '#f0883e', path: (id: string) => `/write/${id}` },
} as const;

interface HomePageProps {
  cardSets: CardSet[];
  folders: Folder[];
  loading: boolean;
  userId?: string;
}

// ── 인라인 플래시카드 미니뷰 ──
function MiniFlashcard({ set }: { set: CardSet }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const cards = set.cards;
  if (cards.length === 0) return null;
  const card = cards[idx];
  return (
    <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
      <div
        className="flip-card"
        style={{ height: 120, cursor: 'pointer' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
          <div className="flip-front" style={{ borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>용어</p>
            <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4 }}>{card.term}</p>
          </div>
          <div className="flip-back" style={{ borderRadius: 10, padding: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>정의</p>
            <p style={{ fontSize: 14, lineHeight: 1.4 }}>{card.definition}</p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 }}>
        <button onClick={e => { e.stopPropagation(); setIdx(i => Math.max(0, i - 1)); setFlipped(false); }}
          disabled={idx === 0}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', opacity: idx === 0 ? 0.3 : 1 }}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{idx + 1} / {cards.length}</span>
        <button onClick={e => { e.stopPropagation(); setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
          disabled={idx === cards.length - 1}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', opacity: idx === cards.length - 1 ? 0.3 : 1 }}>
          <ChevronRight size={16} />
        </button>
        <button onClick={e => { e.stopPropagation(); setIdx(0); setFlipped(false); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}>
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  );
}

// ── 세트 카드 ──
function SetCard({ set, onClick, expanded, onToggleExpand }: {
  set: CardSet;
  onClick: () => void;
  expanded: boolean;
  onToggleExpand: (e: React.MouseEvent) => void;
}) {
  const navigate = useNavigate();
  const total = set.cards.length;
  const stats = Object.values(set.studyStats?.cardStats ?? {}) as CardStat[];
  const mastered = stats.filter(c => c.difficulty === 'easy').length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="set-card" style={{ cursor: 'default' }}>
      <div onClick={onClick} style={{ cursor: 'pointer' }}>
        {set.category && (
          <span className="badge badge-blue" style={{ marginBottom: 8, display: 'inline-block' }}>{set.category}</span>
        )}
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>{set.title}</h3>
        {set.description && (
          <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
            {set.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: pct > 0 ? 10 : 0 }}>
          <span className="badge badge-gray">{total}개 카드</span>
          {mastered > 0 && <span className="badge badge-green">{mastered} 숙달</span>}
        </div>
        {pct > 0 && (
          <div className="progress-track" style={{ marginBottom: 2 }}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>

      {/* 빠른 학습 버튼 행 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: 11 }}
          onClick={() => navigate(`/flashcard/${set.id}`)}>
          <Zap size={12} /> 플래시
        </button>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: 11 }}
          onClick={() => navigate(`/test/${set.id}`)}>
          <PenLine size={12} /> 테스트
        </button>
        <button className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: 11 }}
          onClick={() => navigate(`/match/${set.id}`)}>
          <Shuffle size={12} /> 매칭
        </button>
        <button
          className={`btn btn-sm ${expanded ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: 11, paddingLeft: 8, paddingRight: 8 }}
          onClick={onToggleExpand}
          title="카드 미리보기"
        >
          <BookOpen size={12} />
        </button>
      </div>

      {expanded && <MiniFlashcard set={set} />}
    </div>
  );
}

// 세션 데이터 타입
interface SessionInfo {
  progress: Record<string, unknown>;
  completed: boolean;
  updated_at: string;
}
type SessionMap = Record<string, Record<string, SessionInfo>>;

export default function HomePage({ cardSets, loading, userId }: HomePageProps) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingMode, setPendingMode] = useState<'flashcard' | 'learn' | 'test' | 'match' | null>(null);
  const streak = loadStreak();

  // Supabase 세션 데이터 (비동기 로드)
  const [sessionMap, setSessionMap] = useState<SessionMap>({});
  useEffect(() => {
    if (!userId) return;
    loadAllSessions(userId).then(rows => {
      const map: SessionMap = {};
      for (const row of rows) {
        if (!map[row.set_id]) map[row.set_id] = {};
        map[row.set_id][row.mode] = { progress: row.progress, completed: row.completed, updated_at: row.updated_at };
      }
      setSessionMap(map);
    });
  }, [userId, cardSets]);

  // 오늘 복습 대상 카드 수 (오늘 이미 완료했으면 0)
  const now = Date.now();
  const REVIEW_SET_ID = '00000000-0000-0000-0000-000000000000';
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayReviewDone = (() => {
    const cloud = sessionMap[REVIEW_SET_ID]?.['review'];
    if (cloud && cloud.completed && cloud.progress.date === todayKey) return true;
    try {
      const v = localStorage.getItem('qf-review-result');
      if (!v) return false;
      const r = JSON.parse(v);
      return r.date === todayKey;
    } catch { return false; }
  })();
  const dueCount = todayReviewDone ? 0 : cardSets.reduce((total, set) =>
    total + set.cards.filter(card => {
      const stat = set.studyStats?.cardStats?.[card.id];
      if (!stat) return false;
      if (!stat.nextReview) return false;
      return stat.nextReview <= now;
    }).length, 0
  );

  const recent = [...cardSets].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);

  // 완료 여부: Supabase 우선 → localStorage fallback
  const isCompleted = (setId: string, mode: string): boolean => {
    const cloud = sessionMap[setId]?.[mode];
    if (cloud !== undefined) return cloud.completed;
    if (mode === 'flashcard') return loadCompleted(setId, 'flashcard');
    if (mode === 'test') return loadTestCompleted(setId);
    if (mode === 'learn') return loadLearnCompleted(setId);
    return false;
  };

  // 마지막 모드: Supabase updated_at 기준 → localStorage fallback
  const getLastMode = (setId: string): string => {
    const modes = sessionMap[setId];
    if (modes) {
      const entries = Object.entries(modes).filter(([m]) => m !== 'review');
      if (entries.length > 0) {
        entries.sort((a, b) => new Date(b[1].updated_at).getTime() - new Date(a[1].updated_at).getTime());
        return entries[0][0];
      }
    }
    return loadLastMode(setId) ?? 'flashcard';
  };

  // 가장 최근에 공부한 세트 (진행 중, 완료되지 않은 것만) — 최대 2개
  // 플래시카드와 매칭은 이어하기에서 제외 (단순 열람 모드)
  const inProgress = [...cardSets]
    .filter(s => {
      if (!s.studyStats?.lastStudied) return false;
      const lastMode = getLastMode(s.id);
      if (lastMode === 'match' || lastMode === 'flashcard') return false;
      return !isCompleted(s.id, lastMode);
    })
    .sort((a, b) => (b.studyStats?.lastStudied ?? 0) - (a.studyStats?.lastStudied ?? 0))
    .slice(0, 2);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (cardSets.length === 0) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, var(--blue-bg), var(--purple-bg))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <BookOpen size={32} color="var(--blue)" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>첫 번째 세트를 만들어보세요</h2>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 32, lineHeight: 1.8 }}>
          QuizFlow로 플래시카드를 만들고<br />다양한 학습 모드로 공부하세요.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/create')}>
          <Plus size={18} /> 새 세트 만들기
        </button>
      </div>
    );
  }

  return (
    <>
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* ── 스트릭 배너 ── */}
      {streak >= 2 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: 'linear-gradient(135deg, rgba(210,153,34,.12), rgba(240,136,62,.08))', border: '1px solid rgba(210,153,34,.25)', borderRadius: 12, marginBottom: 24 }}>
          <Flame size={20} color="var(--yellow)" fill="var(--yellow)" />
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--yellow)' }}>{streak}일 연속 학습 중!</span>
            <span style={{ fontSize: 13, color: 'var(--text-2)', marginLeft: 8 }}>오늘도 학습을 이어가세요.</span>
          </div>
        </div>
      )}

      {/* ── 오늘의 복습 ── */}
      {dueCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'linear-gradient(135deg, var(--purple-bg), var(--blue-bg))', border: '1px solid rgba(110,64,201,.25)', borderRadius: 12, marginBottom: 24, cursor: 'pointer' }}
          onClick={() => navigate('/review')}>
          <div style={{ width: 40, height: 40, background: 'rgba(110,64,201,.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <RefreshCw size={18} color="var(--purple)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>오늘 복습할 카드 <span style={{ color: 'var(--purple)' }}>{dueCount}장</span></div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>간격 반복 학습으로 장기 기억을 강화하세요</div>
          </div>
          <span onClick={e => e.stopPropagation()}>
            <InfoTooltip
              text={'간격 반복(Spaced Repetition) 알고리즘이 선별한 카드입니다.\n\n학습할수록 복습 주기가 늘어납니다:\n1일 → 3일 → 7일 → 14일 → 30일\n\n틀리면 다음 날 다시 복습 대상이 됩니다.'}
              position="left" width={250} />
          </span>
          <ArrowRight size={16} color="var(--text-3)" />
        </div>
      )}

      {/* ── 멈춘 지점에서 계속하기 ── */}
      {inProgress.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} color="var(--purple)" /> 멈춘 지점에서 계속하기
            <InfoTooltip
              text={'학습을 중간에 나간 세트가 여기에 표시됩니다.\n\n• 플래시카드: 마지막으로 본 카드 위치에서 재개\n• 학습하기: 저장된 큐(남은 카드 목록)에서 재개\n• 테스트: 마지막 설정으로 바로 시작\n\n모든 카드를 완료하면 이 목록에서 사라집니다.'}
              position="right" width={270} />
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {inProgress.map(set => {
              const total = set.cards.length;
              const lastMode = getLastMode(set.id);
              const meta = MODE_META[lastMode as keyof typeof MODE_META] ?? MODE_META.flashcard;

              // ── 모드별 진행도 계산: Supabase 우선 → localStorage fallback ──
              let viewedCount = 0;
              let viewedTotal = total;

              const cloudSession = sessionMap[set.id]?.[lastMode];
              if (lastMode === 'flashcard') {
                const cloudIdx = typeof cloudSession?.progress?.idx === 'number' ? cloudSession.progress.idx : null;
                const savedIdx = cloudIdx ?? loadProgress(set.id);
                viewedCount = Math.min(savedIdx + 1, total);
                viewedTotal = total;
              } else if (lastMode === 'test') {
                const cloudIdx = typeof cloudSession?.progress?.idx === 'number' ? cloudSession.progress.idx : null;
                const cloudTotal = typeof cloudSession?.progress?.total === 'number' ? cloudSession.progress.total : null;
                const localProg = loadTestProgress(set.id);
                viewedCount = cloudIdx ?? localProg?.idx ?? 0;
                viewedTotal = cloudTotal ?? localProg?.total ?? total;
              } else if (lastMode === 'learn') {
                const cloudMastered = typeof cloudSession?.progress?.mastered === 'number' ? cloudSession.progress.mastered : null;
                const cloudTotal = typeof cloudSession?.progress?.total === 'number' ? cloudSession.progress.total : null;
                const localProg = loadLearnProgress(set.id);
                viewedCount = cloudMastered ?? localProg?.mastered ?? 0;
                viewedTotal = cloudTotal ?? localProg?.total ?? total;
              } else {
                const cardStatMap = set.studyStats?.cardStats ?? {};
                viewedCount = set.cards.filter(c => cardStatMap[c.id]).length;
                viewedTotal = total;
              }

              const pct = viewedTotal > 0 ? Math.round((viewedCount / viewedTotal) * 100) : 0;

              // 플래시카드는 savedIdx에서 이어서, 나머지는 ?resume=1로 바로 시작
              const cloudIdx = typeof cloudSession?.progress?.idx === 'number' ? cloudSession.progress.idx : null;
              const savedIdx = cloudIdx ?? loadProgress(set.id);
              const continuePath = lastMode === 'flashcard'
                ? `${meta.path(set.id)}?start=${savedIdx >= total - 1 ? 0 : savedIdx}`
                : `${meta.path(set.id)}?resume=1`;

              return (
                <div key={set.id} className="card card-hover"
                  style={{ padding: '22px 24px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={() => navigate(`/set/${set.id}`)}>

                  {/* 상단 모드 뱃지 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: `color-mix(in srgb, ${meta.color} 15%, transparent)`, padding: '3px 9px', borderRadius: 99, border: `1px solid color-mix(in srgb, ${meta.color} 30%, transparent)` }}>
                      {meta.label} 이어하기
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
                      {total}개 카드
                    </span>
                  </div>

                  {/* 제목 */}
                  <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 16, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {set.title}
                  </div>

                  {/* 진행도 바 */}
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ height: 8, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}, color-mix(in srgb, ${meta.color} 60%, #6e40c9))`, borderRadius: 99, transition: 'width .4s' }} />
                    </div>
                  </div>

                  {/* 진행 텍스트 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>
                      {pct}% 완료 · {viewedCount}/{viewedTotal}개
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {lastMode === 'flashcard' ? '열람 기준' : lastMode === 'test' ? '제출 기준' : lastMode === 'learn' ? '숙달 기준' : '학습 기준'}
                    </span>
                  </div>

                  {/* 계속하기 버튼 */}
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ background: `linear-gradient(135deg, ${meta.color}, color-mix(in srgb, ${meta.color} 70%, #6e40c9))` }}
                    onClick={e => { e.stopPropagation(); navigate(continuePath); }}>
                    계속하기
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 빠른 시작 모드 ── */}
      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)', marginBottom: 14 }}>여기서 시작하기</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { icon: Zap, label: '낱말카드', sub: '플래시카드', color: 'var(--blue)', bg: 'var(--blue-bg)', mode: 'flashcard' as const },
            { icon: Brain, label: '학습하기', sub: '적응형 학습', color: 'var(--purple)', bg: 'var(--purple-bg)', mode: 'learn' as const },
            { icon: PenLine, label: '테스트', sub: '실력 점검', color: 'var(--green)', bg: 'var(--green-bg)', mode: 'test' as const },
            { icon: Shuffle, label: '카드 맞추기', sub: '매칭 게임', color: 'var(--yellow)', bg: 'var(--yellow-bg)', mode: 'match' as const },
            { icon: Plus, label: '새 세트', sub: '직접 만들기', color: '#f0883e', bg: 'rgba(240,136,62,.15)', mode: null as null },
          ].map(({ icon: Icon, label, sub, color, bg, mode }) => (
            <div key={label} className="mode-btn" onClick={() => {
              if (mode === null) { navigate('/create'); return; }
              if (cardSets.length === 0) { navigate('/library'); return; }
              if (cardSets.length === 1) { navigate(MODE_META[mode].path(cardSets[0].id)); return; }
              setPendingMode(mode);
            }} style={{ cursor: 'pointer', padding: 16 }}>
              <div className="mode-icon" style={{ background: bg, width: 36, height: 36, borderRadius: 10 }}>
                <Icon size={16} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 통계 ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: '총 세트', value: cardSets.length, color: 'var(--blue)' },
            { label: '총 카드', value: cardSets.reduce((s, set) => s + set.cards.length, 0), color: 'var(--purple)' },
            { label: '숙달 카드', value: cardSets.reduce((s, set) => s + (Object.values(set.studyStats?.cardStats ?? {}) as CardStat[]).filter(c => c.difficulty === 'easy').length, 0), color: 'var(--green)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-value" style={{ color, fontSize: 28 }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 최근 세트 (카드 미리보기 포함) ── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>최근 세트</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/library')} style={{ gap: 4 }}>
            전체 보기 <ArrowRight size={13} />
          </button>
        </div>
        <div className="sets-grid">
          {recent.map(set => (
            <SetCard
              key={set.id}
              set={set}
              onClick={() => navigate(`/set/${set.id}`)}
              expanded={expandedId === set.id}
              onToggleExpand={e => { e.stopPropagation(); setExpandedId(expandedId === set.id ? null : set.id); }}
            />
          ))}
        </div>
      </section>

    </div>

    {/* ── 세트 선택 모달 ── */}
    {pendingMode && (
      <div className="modal-overlay" onClick={() => setPendingMode(null)}>
        <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>세트 선택</h3>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {MODE_META[pendingMode].label}으로 학습할 세트를 선택하세요
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setPendingMode(null)} style={{ padding: 6 }}>
              <X size={16} />
            </button>
          </div>
          <div className="modal-body" style={{ padding: '12px 16px', maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cardSets.map(set => (
              <button
                key={set.id}
                className="btn btn-secondary btn-md"
                style={{ justifyContent: 'space-between', textAlign: 'left', padding: '12px 16px', width: '100%' }}
                onClick={() => { navigate(MODE_META[pendingMode!].path(set.id)); setPendingMode(null); }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>{set.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-2)', flexShrink: 0, marginLeft: 12 }}>{set.cards.length}개</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
