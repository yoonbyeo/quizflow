import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. 수집하는 개인정보',
      content: `QuizFlow는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.

• 이메일 주소: 계정 생성 및 로그인에 사용됩니다.
• 이름(닉네임): 프로필 표시에 사용됩니다.
• 프로필 사진: Google 로그인 시 선택적으로 연동됩니다.
• 학습 데이터: 플래시카드 세트, 카드 내용, 학습 진행도 및 통계가 저장됩니다.
• 이미지 파일: 카드에 첨부한 이미지가 안전하게 저장됩니다.`,
    },
    {
      title: '2. 개인정보 수집 및 이용 목적',
      content: `수집된 개인정보는 다음 목적으로만 활용됩니다.

• 서비스 제공: 플래시카드 학습, 테스트, 통계 등 핵심 기능 제공
• 계정 관리: 회원 식별 및 인증
• 데이터 동기화: 여러 기기에서 학습 데이터 동기화
• 서비스 개선: 오류 분석 및 기능 개선 (익명 처리된 데이터 한정)`,
    },
    {
      title: '3. 개인정보 보관 기간',
      content: `• 회원 탈퇴 시까지 개인정보를 보관합니다.
• 회원 탈퇴 후 즉시 모든 개인정보 및 학습 데이터를 삭제합니다.
• 단, 관계 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.`,
    },
    {
      title: '4. 제3자 제공',
      content: `QuizFlow는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
다만 다음의 경우에는 예외입니다.

• 이용자가 사전에 동의한 경우
• 법령의 규정에 따르거나, 수사기관의 요구가 있는 경우

서비스 운영을 위해 다음 외부 서비스를 이용합니다.
• Supabase: 데이터베이스 및 인증 서비스 (미국 소재)
• Google OAuth: 소셜 로그인 (선택 사항)`,
    },
    {
      title: '5. 쿠키 및 로컬 스토리지',
      content: `QuizFlow는 서비스 향상을 위해 다음을 사용합니다.

• 로컬 스토리지(Local Storage): 테마 설정, 학습 진행도, 사이드바 상태 등을 기기에 저장합니다.
• 세션 쿠키: 로그인 상태 유지에 사용됩니다.

브라우저 설정을 통해 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.`,
    },
    {
      title: '6. 이용자의 권리',
      content: `이용자는 언제든지 다음 권리를 행사할 수 있습니다.

• 개인정보 열람 요청
• 개인정보 수정 및 삭제 요청
• 개인정보 처리 정지 요청
• 계정 탈퇴 (프로필 페이지에서 요청 가능)

권리 행사는 프로필 설정 페이지 또는 아래 연락처를 통해 할 수 있습니다.`,
    },
    {
      title: '7. 보안',
      content: `QuizFlow는 개인정보 보호를 위해 다음과 같은 보안 조치를 취하고 있습니다.

• 모든 데이터는 HTTPS를 통해 암호화 전송됩니다.
• 비밀번호는 단방향 암호화(해시)로 저장됩니다.
• 데이터베이스는 행 단위 보안 정책(RLS)으로 보호됩니다.
• 다른 사용자의 데이터에 접근할 수 없습니다.`,
    },
    {
      title: '8. 문의',
      content: `개인정보 처리에 관한 문의사항은 도움말 및 피드백 페이지를 통해 연락주세요.
QuizFlow 팀은 빠른 시일 내에 답변드리겠습니다.`,
    },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24, gap: 4 }}>
        <ChevronLeft size={15} /> 뒤로
      </button>

      {/* 헤더 */}
      <div className="card card-glow" style={{ padding: '32px 36px', marginBottom: 24, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={26} color="var(--blue)" />
          </div>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>개인정보 취급방침</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7 }}>
          QuizFlow는 이용자의 개인정보를 소중히 여기며, 관련 법령을 준수합니다.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>최종 업데이트: 2026년 3월 1일</p>
      </div>

      {/* 섹션들 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sections.map((sec) => (
          <div key={sec.title} className="card" style={{ padding: '22px 26px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: 'var(--blue)' }}>{sec.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{sec.content}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, textAlign: 'center', paddingBottom: 40 }}>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
          본 방침은 QuizFlow 서비스에 적용되며, 변경 시 앱 내 공지를 통해 안내합니다.
        </p>
      </div>
    </div>
  );
}
