import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogle = async () => {
    setLoading(true); setError('');
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const fn = mode === 'login' ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);
    if (error) {
      setError(error.message);
    } else if (mode === 'signup') {
      setSuccess('인증 메일을 확인해 주세요!');
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div className="logo-icon">
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <span className="logo-text" style={{ fontSize: 22 }}>QuizFlow</span>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text-2)', marginTop: 4 }}>스마트한 학습을 시작하세요</p>
        </div>

        {/* Tab */}
        <div className="tab-group" style={{ marginBottom: 24 }}>
          <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>로그인</button>
          <button className={`tab-btn ${mode === 'signup' ? 'active' : ''}`} onClick={() => setMode('signup')}>회원가입</button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '11px 16px',
            background: '#fff',
            color: '#0d1117',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 16,
            boxShadow: '0 2px 8px rgba(0,0,0,.3)',
            transition: 'opacity .15s',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google로 {mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <div className="divider" style={{ marginBottom: 16 }}>또는</div>

        {/* Email form */}
        <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              type="email"
              className="input"
              style={{ paddingLeft: 38 }}
              placeholder="이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              type={showPw ? 'text' : 'password'}
              className="input"
              style={{ paddingLeft: 38, paddingRight: 38 }}
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex' }}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <button type="submit" className="btn btn-primary btn-md" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? (
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
            ) : null}
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}
