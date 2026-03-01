import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronLeft, Zap, Image, X, FileUp } from 'lucide-react';
import { parseCSV } from '../utils/csv';
import type { Folder } from '../types';

interface CreateSetPageProps {
  onCreate: (title: string, description?: string, category?: string, cards?: { term: string; definition: string; hint?: string; imageUrl?: string }[], folderId?: string) => Promise<unknown>;
  folders: Folder[];
  onUploadImage?: (file: File) => Promise<string | null>;
}

interface DraftCard {
  term: string;
  definition: string;
  hint: string;
  imageUrl?: string;
  uploading?: boolean;
}

export default function CreateSetPage({ onCreate, folders, onUploadImage }: CreateSetPageProps) {
  const navigate = useNavigate();
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const csvRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [folderId, setFolderId] = useState('');
  const [cards, setCards] = useState<DraftCard[]>([
    { term: '', definition: '', hint: '' },
    { term: '', definition: '', hint: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvInfo, setCsvInfo] = useState('');

  const handleCsvImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) { setError('CSV에서 카드를 읽을 수 없습니다. 형식을 확인하세요.'); return; }
      const newCards: DraftCard[] = parsed.map(c => ({ term: c.term, definition: c.definition, hint: c.hint ?? '' }));
      setCards(prev => {
        const empty = prev.filter(c => !c.term && !c.definition);
        return empty.length === prev.length ? newCards : [...prev.filter(c => c.term || c.definition), ...newCards];
      });
      setCsvInfo(`CSV에서 ${parsed.length}개 카드를 가져왔습니다.`);
      setTimeout(() => setCsvInfo(''), 3000);
    };
    reader.readAsText(file, 'utf-8');
  };

  const addCard = () => setCards(c => [...c, { term: '', definition: '', hint: '' }]);
  const removeCard = (i: number) => setCards(c => c.filter((_, idx) => idx !== i));
  const updateCard = (i: number, field: keyof DraftCard, value: string) =>
    setCards(c => c.map((card, idx) => idx === i ? { ...card, [field]: value } : card));

  const handleImageUpload = async (i: number, file: File) => {
    if (!onUploadImage) return;
    setCards(c => c.map((card, idx) => idx === i ? { ...card, uploading: true } : card));
    const url = await onUploadImage(file);
    setCards(c => c.map((card, idx) => idx === i ? { ...card, imageUrl: url ?? undefined, uploading: false } : card));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('제목을 입력하세요.'); return; }
    const validCards = cards.filter(c => c.term.trim() && c.definition.trim());
    if (validCards.length === 0) { setError('카드를 최소 1개 이상 추가하세요.'); return; }
    setLoading(true); setError('');
    try {
      const result = await onCreate(
        title.trim(),
        description.trim() || undefined,
        category.trim() || undefined,
        validCards.map(c => ({ term: c.term, definition: c.definition, hint: c.hint || undefined, imageUrl: c.imageUrl })),
        folderId || undefined
      );
      if (result && (result as { id?: string }).id) {
        navigate(`/set/${(result as { id: string }).id}`);
      } else {
        navigate('/library');
      }
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ gap: 4 }}>
          <ChevronLeft size={15} /> 뒤로
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 800 }}>새 세트 만들기</h1>
        <div style={{ width: 60 }} />
      </div>

      <form onSubmit={handleSubmit}>
        {/* Set info */}
        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>제목 *</label>
              <input type="text" className="input" placeholder="예: 영어 단어 - Chapter 1" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${folders.length > 0 ? 3 : 2}, 1fr)`, gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>카테고리</label>
                <input type="text" className="input" placeholder="예: 영어, 역사..." value={category} onChange={e => setCategory(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>설명</label>
                <input type="text" className="input" placeholder="세트 설명 (선택)" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              {folders.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>폴더</label>
                  <select className="input" value={folderId} onChange={e => setFolderId(e.target.value)} style={{ cursor: 'pointer' }}>
                    <option value="">폴더 없음</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {cards.map((card, i) => (
            <div key={i} className="card-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>카드 {i + 1}</span>
                {cards.length > 1 && (
                  <button type="button" onClick={() => removeCard(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 4 }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>용어</label>
                  <input type="text" className="input" placeholder="용어 입력..." value={card.term} onChange={e => updateCard(i, 'term', e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>정의</label>
                  <input type="text" className="input" placeholder="정의 입력..." value={card.definition} onChange={e => updateCard(i, 'definition', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>힌트 (선택)</label>
                  <input type="text" className="input" placeholder="힌트..." value={card.hint} onChange={e => updateCard(i, 'hint', e.target.value)} />
                </div>

                {/* Image */}
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>이미지</label>
                  {card.imageUrl ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={card.imageUrl} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
                      <button type="button"
                        onClick={() => setCards(c => c.map((ca, idx) => idx === i ? { ...ca, imageUrl: undefined } : ca))}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: 'var(--red)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={10} color="#fff" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        ref={el => { fileRefs.current[i] = el; }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(i, f); }} />
                      <button type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => fileRefs.current[i]?.click()}
                        disabled={card.uploading || !onUploadImage}
                        title={!onUploadImage ? 'Storage 설정 필요' : '이미지 추가'}
                        style={{ width: 56, height: 56, padding: 0, flexDirection: 'column', gap: 2, fontSize: 10 }}>
                        {card.uploading
                          ? <span style={{ width: 14, height: 14, border: '2px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
                          : <><Image size={16} /><span>추가</span></>
                        }
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {csvInfo && <div className="alert alert-success" style={{ marginBottom: 12, fontSize: 13 }}>{csvInfo}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-secondary btn-md" onClick={addCard}>
              <Plus size={15} /> 카드 추가
            </button>
            <input type="file" accept=".csv,.tsv,.txt" style={{ display: 'none' }} ref={csvRef}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvImport(f); e.target.value = ''; }} />
            <button type="button" className="btn btn-secondary btn-md" onClick={() => csvRef.current?.click()}
              title="CSV 파일에서 카드 가져오기 (용어,정의,힌트 형식)">
              <FileUp size={15} /> CSV 가져오기
            </button>
          </div>
          <button type="submit" className="btn btn-primary btn-md" disabled={loading}>
            {loading
              ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
              : <Zap size={15} />}
            세트 저장
          </button>
        </div>
      </form>
    </div>
  );
}
