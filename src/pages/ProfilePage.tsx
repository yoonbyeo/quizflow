import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User as UserIcon, Camera, Save, Sun, Moon, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import type { User } from '@supabase/supabase-js';

interface ProfilePageProps {
  user: User | null;
}

export default function ProfilePage({ user }: ProfilePageProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.user_metadata?.avatar_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `avatars/${user!.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('card-images').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('card-images').getPublicUrl(path);
      setAvatarUrl(data.publicUrl + `?t=${Date.now()}`);
    } catch (e: any) {
      setError('이미지 업로드 실패: ' + (e?.message ?? ''));
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          avatar_url: avatarUrl || user.user_metadata?.avatar_url,
        },
      });
      if (updateError) throw updateError;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError('저장 실패: ' + (e?.message ?? ''));
    }
    setSaving(false);
  };

  const initials = (displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24, gap: 4 }}>
        <ChevronLeft size={15} /> 뒤로
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>프로필 설정</h1>

      {/* 아바타 */}
      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>프로필 사진</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarUrl ? (
              <img src={avatarUrl} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #1f6feb, #6e40c9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--blue)', border: '2px solid var(--bg-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {uploading
                ? <span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                : <Camera size={13} color="#fff" />
              }
            </button>
          </div>
          <div>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>JPG, PNG, GIF 파일 지원</p>
            <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              사진 변경
            </button>
            {avatarUrl && (
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8, color: 'var(--red)' }}
                onClick={() => setAvatarUrl('')}>
                제거
              </button>
            )}
          </div>
          <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); }} />
        </div>
      </div>

      {/* 이름 */}
      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>기본 정보</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>표시 이름</label>
          <input type="text" className="input" placeholder="이름 입력..." value={displayName}
            onChange={e => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>이메일</label>
          <input type="text" className="input" value={user?.email ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
        </div>
      </div>

      {/* 테마 */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>화면 테마</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            { id: 'dark', label: '다크 모드', icon: Moon, desc: '어두운 배경' },
            { id: 'light', label: '라이트 모드', icon: Sun, desc: '밝은 배경' },
          ] as const).map(({ id, label, icon: Icon, desc }) => (
            <button key={id} onClick={() => { if (theme !== id) toggleTheme(); }}
              style={{
                padding: '16px 20px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                background: theme === id ? 'var(--blue-bg)' : 'var(--bg-2)',
                border: `2px solid ${theme === id ? 'var(--blue)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: theme === id ? 'var(--blue)' : 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={theme === id ? '#fff' : 'var(--text-2)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme === id ? 'var(--blue)' : 'var(--text-1)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{desc}</div>
              </div>
              {theme === id && <Check size={16} color="var(--blue)" />}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {saved && <div className="alert alert-success" style={{ marginBottom: 16 }}><Check size={14} /> 저장됐습니다!</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary btn-md" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
          {saving
            ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
            : <Save size={15} />
          }
          변경사항 저장
        </button>
        <button className="btn btn-secondary btn-md" onClick={() => navigate(-1)}>취소</button>
      </div>

      {/* 계정 정보 */}
      <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg-2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
        <UserIcon size={16} color="var(--text-3)" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>가입일</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {user?.created_at ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(user.created_at)) : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
