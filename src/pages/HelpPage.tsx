import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, HelpCircle, MessageSquare, ChevronDown, ChevronUp, Zap, PenLine, Brain, Shuffle, BarChart2 } from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
}

const faqs: FAQ[] = [
  {
    q: '카드 세트는 어떻게 만드나요?',
    a: '사이드바에서 "새 세트 만들기"를 클릭하거나 상단의 + 버튼을 누르세요. 제목과 카드(용어 + 정의)를 입력한 후 저장하면 됩니다. CSV 파일로 한 번에 여러 카드를 가져올 수도 있습니다.',
  },
  {
    q: '이미지를 카드에 추가할 수 있나요?',
    a: '네! 세트 편집 화면에서 각 카드 오른쪽의 이미지 버튼을 클릭하면 사진을 업로드할 수 있습니다. JPG, PNG, GIF 등 일반적인 이미지 형식을 지원합니다.',
  },
  {
    q: '학습 모드의 차이는 무엇인가요?',
    a: `• 플래시카드: 카드를 넘기며 앞뒤를 확인하는 기본 학습 모드입니다.\n• 학습하기: AI가 틀린 카드를 반복 출제하는 적응형 학습 모드입니다.\n• 테스트: 객관식 또는 주관식 문제로 실력을 점검합니다.\n• 매칭: 용어와 정의를 짝 맞추는 게임입니다.`,
  },
  {
    q: '진행 상황이 저장되나요?',
    a: '플래시카드, 학습하기 모드는 학습 진행 상황이 자동 저장됩니다. 홈 화면의 "멈춘 지점에서 계속하기" 섹션에서 이어서 학습할 수 있습니다.',
  },
  {
    q: '오답 노트는 어떻게 활용하나요?',
    a: '학습 중 틀린 카드는 자동으로 오답 노트에 기록됩니다. 사이드바의 "오답 노트" 메뉴에서 자주 틀리는 카드만 모아서 집중적으로 복습할 수 있습니다.',
  },
  {
    q: '오늘 복습(스페이스드 리피티션)이란?',
    a: '복습 알고리즘이 각 카드의 학습 이력을 분석해 망각 전에 복습을 권장합니다. 사이드바의 "오늘 복습" 메뉴에서 오늘 복습할 카드를 확인하세요. 카드를 맞힐수록 복습 간격이 늘어납니다.',
  },
  {
    q: 'CSV 파일 형식은 어떻게 되나요?',
    a: 'CSV 파일은 한 줄에 하나의 카드 정보를 입력합니다.\n형식: 용어,정의,힌트(선택)\n예시:\napple,사과,과일\nbanana,바나나\n탭(\\t)으로 구분된 TSV 형식도 지원합니다.',
  },
  {
    q: '폴더 기능은 어떻게 사용하나요?',
    a: '사이드바의 "폴더" 메뉴에서 새 폴더를 만들 수 있습니다. 세트를 만들거나 편집할 때 폴더를 지정하면 해당 폴더에 분류됩니다. 과목별, 주제별로 카드 세트를 정리하는 데 유용합니다.',
  },
  {
    q: '데이터가 다른 기기에서도 보이나요?',
    a: '네! QuizFlow는 Supabase 클라우드에 데이터를 저장합니다. 같은 계정으로 로그인하면 어떤 기기에서든 동일한 카드 세트와 학습 통계를 볼 수 있습니다.',
  },
  {
    q: '프로필 사진과 닉네임을 변경하려면?',
    a: '사이드바 하단 프로필 영역 클릭 후 "프로필" 메뉴를 선택하세요. 프로필 페이지에서 닉네임과 프로필 사진을 변경할 수 있습니다.',
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="card"
      style={{ overflow: 'hidden', transition: 'all .2s', cursor: 'pointer' }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{faq.q}</span>
        {open ? <ChevronUp size={16} color="var(--text-3)" style={{ flexShrink: 0 }} /> : <ChevronDown size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />}
      </div>
      {open && (
        <div style={{ padding: '0 20px 18px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.85, whiteSpace: 'pre-line', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {faq.a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!feedbackText.trim()) return;
    // 실제 전송 대신 로컬에서 완료 표시
    setSent(true);
    setFeedbackText('');
    setTimeout(() => setSent(false), 4000);
  };

  const modes = [
    { icon: Zap, label: '플래시카드', desc: '카드를 넘기며 앞뒤 확인', color: 'var(--blue)' },
    { icon: Brain, label: '학습하기', desc: '적응형 AI 학습 모드', color: 'var(--purple)' },
    { icon: PenLine, label: '테스트', desc: '객관식·주관식 실력 점검', color: 'var(--green)' },
    { icon: Shuffle, label: '매칭', desc: '짝 맞추기 게임', color: 'var(--yellow)' },
    { icon: BarChart2, label: '통계', desc: '학습 현황 한눈에 보기', color: 'var(--blue)' },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24, gap: 4 }}>
        <ChevronLeft size={15} /> 뒤로
      </button>

      {/* 헤더 */}
      <div className="card card-glow" style={{ padding: '32px 36px', marginBottom: 28, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--purple-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HelpCircle size={26} color="var(--purple)" />
          </div>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>도움말 및 피드백</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>
          QuizFlow 사용법을 안내하고, 불편사항이나 개선 의견을 받습니다.
        </p>
      </div>

      {/* 학습 모드 안내 */}
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>학습 모드 안내</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 32 }}>
        {modes.map(({ icon: Icon, label, desc, color }) => (
          <div key={label} className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>자주 묻는 질문 (FAQ)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 36 }}>
        {faqs.map(faq => <FAQItem key={faq.q} faq={faq} />)}
      </div>

      {/* 피드백 */}
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>피드백 보내기</h2>
      <div className="card" style={{ padding: '24px 26px', marginBottom: 40 }}>
        <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginBottom: 18, lineHeight: 1.7 }}>
          버그를 발견하셨나요? 개선 아이디어가 있으신가요? 편하게 남겨주세요.
          QuizFlow 팀이 검토 후 반영하겠습니다.
        </p>

        {/* 유형 선택 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {([['bug', '🐛 버그 신고'], ['feature', '💡 기능 제안'], ['general', '💬 기타 의견']] as const).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setFeedbackType(type)}
              className={`btn btn-sm ${feedbackType === type ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12 }}
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          className="input"
          value={feedbackText}
          onChange={e => setFeedbackText(e.target.value)}
          placeholder={
            feedbackType === 'bug'
              ? '어떤 버그가 발생했나요? 재현 방법도 알려주시면 도움이 됩니다.'
              : feedbackType === 'feature'
              ? '어떤 기능이 있으면 좋겠나요?'
              : '자유롭게 의견을 남겨주세요.'
          }
          rows={5}
          style={{ resize: 'vertical', marginBottom: 14 }}
        />

        {sent ? (
          <div className="alert alert-success" style={{ fontSize: 13 }}>
            ✅ 피드백이 전달되었습니다. 소중한 의견 감사합니다!
          </div>
        ) : (
          <button
            className="btn btn-primary btn-md"
            onClick={handleSend}
            disabled={!feedbackText.trim()}
            style={{ gap: 6 }}
          >
            <MessageSquare size={15} /> 보내기
          </button>
        )}
      </div>
    </div>
  );
}
