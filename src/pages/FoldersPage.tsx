import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Plus, Edit2, Trash2, BookOpen, X, Check } from 'lucide-react';
import type { CardSet, Folder as FolderType } from '../types';

interface FoldersPageProps {
  cardSets: CardSet[];
  folders: FolderType[];
  onCreate: (name: string, description?: string, color?: string) => Promise<FolderType | null>;
  onUpdate: (id: string, updates: { name?: string; description?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMoveSet: (setId: string, updates: { folderId?: string | null }) => Promise<void>;
}

const COLORS = ['#388bfd', '#a371f7', '#3fb950', '#d29922', '#f85149', '#f0883e', '#58a6ff', '#bc8cff'];

export default function FoldersPage({ cardSets, folders, onCreate, onUpdate, onDelete, onMoveSet }: FoldersPageProps) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name.trim(), desc.trim() || undefined, color);
    setName(''); setDesc(''); setColor(COLORS[0]); setCreating(false); setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    if (!name.trim()) return;
    setLoading(true);
    await onUpdate(id, { name: name.trim(), description: desc.trim() || undefined, color });
    setEditingId(null); setName(''); setDesc(''); setColor(COLORS[0]); setLoading(false);
  };

  const startEdit = (f: FolderType) => {
    setEditingId(f.id); setName(f.name); setDesc(f.description ?? ''); setColor(f.color);
  };

  const unassigned = cardSets.filter(s => !s.folderId);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>폴더</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>세트를 폴더로 정리하세요</p>
        </div>
        <button className="btn btn-primary btn-md" onClick={() => { setCreating(true); setEditingId(null); setName(''); setDesc(''); setColor(COLORS[0]); }}>
          <Plus size={15} /> 새 폴더
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>새 폴더 만들기</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="text" className="input" placeholder="폴더 이름 *" value={name} onChange={e => setName(e.target.value)} autoFocus />
            <input type="text" className="input" placeholder="설명 (선택)" value={desc} onChange={e => setDesc(e.target.value)} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>색상</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: color === c ? '2px solid #fff' : 'none', cursor: 'pointer', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none', flexShrink: 0 }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setCreating(false)}>취소</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={!name.trim() || loading}>만들기</button>
            </div>
          </div>
        </div>
      )}

      {/* Folders list */}
      {folders.length === 0 && !creating ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 60, height: 60, background: 'var(--bg-2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Folder size={24} color="var(--text-3)" />
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>폴더가 없습니다</p>
          <button className="btn btn-primary btn-md" onClick={() => setCreating(true)}><Plus size={15} /> 폴더 만들기</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {folders.map(folder => {
            const folderSets = cardSets.filter(s => s.folderId === folder.id);
            const isEditing = editingId === folder.id;
            return (
              <div key={folder.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ height: 3, background: folder.color }} />
                <div style={{ padding: '20px 20px 0' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
                      <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} autoFocus />
                      <input type="text" className="input" placeholder="설명" value={desc} onChange={e => setDesc(e.target.value)} />
                      <div style={{ display: 'flex', gap: 6 }}>
                        {COLORS.map(c => (
                          <button key={c} onClick={() => setColor(c)}
                            style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: color === c ? '2px solid #fff' : 'none', cursor: 'pointer', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none', flexShrink: 0 }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}><X size={13} /></button>
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdate(folder.id)} disabled={!name.trim() || loading}><Check size={13} /> 저장</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${folder.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Folder size={18} color={folder.color} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700 }}>{folder.name}</div>
                          {folder.description && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{folder.description}</div>}
                          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{folderSets.length}개 세트</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => startEdit(folder)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'var(--red)' }}
                          onClick={() => { if (confirm(`"${folder.name}" 폴더를 삭제할까요? 세트는 삭제되지 않습니다.`)) onDelete(folder.id); }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sets in folder */}
                {folderSets.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 20px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {folderSets.map(s => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }} onClick={() => navigate(`/set/${s.id}`)}>
                            <BookOpen size={13} color="var(--text-3)" />
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{s.title}</span>
                            <span className="badge badge-gray">{s.cards.length}</span>
                          </div>
                          <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', fontSize: 11, color: 'var(--text-3)' }}
                            onClick={() => onMoveSet(s.id, { folderId: null })}>
                            제거
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Unassigned sets */}
      {unassigned.length > 0 && folders.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12 }}>폴더 없는 세트 ({unassigned.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unassigned.map(s => (
              <div key={s.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/set/${s.id}`)}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</span>
                  <span className="badge badge-gray" style={{ marginLeft: 8 }}>{s.cards.length}</span>
                </div>
                {folders.length > 0 && (
                  <select
                    style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 8px', fontSize: 12, color: 'var(--text-1)', cursor: 'pointer' }}
                    defaultValue=""
                    onChange={e => { if (e.target.value) onMoveSet(s.id, { folderId: e.target.value }); }}
                  >
                    <option value="">폴더 이동...</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
