import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, GripVertical } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

interface CardInput {
  id: string;
  term: string;
  definition: string;
  hint: string;
  isNew?: boolean;
}

export default function EditSetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cardSets, updateCardSet, addCard, updateCard, deleteCard } = useStore();

  const set = cardSets.find((s) => s.id === id);

  const [title, setTitle] = useState(set?.title || '');
  const [description, setDescription] = useState(set?.description || '');
  const [category, setCategory] = useState(set?.category || '');
  const [cards, setCards] = useState<CardInput[]>(() =>
    set?.cards.map((c) => ({ id: c.id, term: c.term, definition: c.definition, hint: c.hint || '' })) || []
  );
  const [deleteCardConfirm, setDeleteCardConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!set) navigate('/');
  }, [set, navigate]);

  const addRow = useCallback(() =>
    setCards((prev) => [...prev, { id: Math.random().toString(36).slice(2), term: '', definition: '', hint: '', isNew: true }]),
    []
  );

  const updateRow = useCallback((id: string, field: keyof CardInput, value: string) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const removeCard = (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    if (card.isNew) {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } else {
      deleteCard(id!, cardId);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    }
    setDeleteCardConfirm(null);
  };

  const handleSave = async () => {
    if (!set || !title.trim()) return;
    setSaving(true);
    updateCardSet(id!, { title: title.trim(), description: description.trim() || undefined, category: category.trim() || undefined });

    const existingIds = new Set(set.cards.map((c) => c.id));
    for (const card of cards) {
      if (!card.term.trim() || !card.definition.trim()) continue;
      if (card.isNew) {
        addCard(id!, card.term.trim(), card.definition.trim(), card.hint.trim() || undefined);
      } else if (existingIds.has(card.id)) {
        updateCard(id!, card.id, { term: card.term.trim(), definition: card.definition.trim(), hint: card.hint.trim() || undefined });
      }
    }

    await new Promise((r) => setTimeout(r, 300));
    navigate(`/set/${id}`);
  };

  if (!set) return null;

  const validCount = cards.filter((c) => c.term.trim() && c.definition.trim()).length;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-100">세트 편집</h1>
            <p className="text-sm text-slate-400 mt-0.5">{validCount}개 카드</p>
          </div>
          <Button onClick={handleSave} disabled={!title.trim()} loading={saving}>
            <Save className="w-4 h-4" />
            저장
          </Button>
        </div>

        <div className="glass rounded-2xl p-6 mb-6 card-glow space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              세트 제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-xl font-semibold text-slate-100 placeholder:text-slate-600 focus:outline-none border-b-2 border-slate-700 focus:border-blue-500 pb-2 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">설명</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">카테고리</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {cards.map((card, index) => (
            <div key={card.id} className="glass rounded-2xl p-5 card-glow group">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 pt-2.5">
                  <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
                  <span className="text-xs font-bold text-slate-600 w-6 text-center">{index + 1}</span>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">용어</label>
                    <textarea
                      value={card.term}
                      onChange={(e) => updateRow(card.id, 'term', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">정의</label>
                    <textarea
                      value={card.definition}
                      onChange={(e) => updateRow(card.id, 'definition', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1.5 font-medium">힌트 (선택)</label>
                    <input
                      type="text"
                      value={card.hint}
                      onChange={(e) => updateRow(card.id, 'hint', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800/60 rounded-xl text-sm text-slate-200 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setDeleteCardConfirm(card.id)}
                  className="mt-2 p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="w-full py-4 glass rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-slate-400 hover:text-blue-400 flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          카드 추가
        </button>
      </div>

      <Modal open={!!deleteCardConfirm} onClose={() => setDeleteCardConfirm(null)} title="카드 삭제" size="sm">
        <p className="text-slate-300 mb-6">이 카드를 삭제하시겠습니까?</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setDeleteCardConfirm(null)}>취소</Button>
          <Button variant="danger" onClick={() => removeCard(deleteCardConfirm!)}>삭제</Button>
        </div>
      </Modal>
    </div>
  );
}
