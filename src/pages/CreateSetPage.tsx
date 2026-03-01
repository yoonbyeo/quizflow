import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, Save, Import, GripVertical } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

interface CardInput {
  id: string;
  term: string;
  definition: string;
  hint: string;
}

const makeCard = (): CardInput => ({
  id: Math.random().toString(36).slice(2),
  term: '',
  definition: '',
  hint: '',
});

export default function CreateSetPage() {
  const navigate = useNavigate();
  const { createCardSet, addCard } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [cards, setCards] = useState<CardInput[]>([makeCard(), makeCard()]);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [saving, setSaving] = useState(false);

  const addRow = useCallback(() => setCards((prev) => [...prev, makeCard()]), []);

  const removeRow = useCallback((id: string) => {
    setCards((prev) => prev.length <= 1 ? prev : prev.filter((c) => c.id !== id));
  }, []);

  const updateRow = useCallback((id: string, field: keyof CardInput, value: string) => {
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const handleSave = async () => {
    const validCards = cards.filter((c) => c.term.trim() && c.definition.trim());
    if (!title.trim()) return;
    setSaving(true);
    const newSet = createCardSet(title.trim(), description.trim() || undefined, category.trim() || undefined);
    for (const card of validCards) {
      addCard(newSet.id, card.term.trim(), card.definition.trim(), card.hint.trim() || undefined);
    }
    await new Promise((r) => setTimeout(r, 300));
    navigate(`/set/${newSet.id}`);
  };

  const handleImport = () => {
    const lines = importText.trim().split('\n');
    const imported: CardInput[] = [];
    for (const line of lines) {
      const parts = line.split(/\t|,\s*/);
      if (parts.length >= 2) {
        imported.push({
          id: Math.random().toString(36).slice(2),
          term: parts[0].trim(),
          definition: parts[1].trim(),
          hint: parts[2]?.trim() || '',
        });
      }
    }
    if (imported.length > 0) {
      setCards((prev) => {
        const filtered = prev.filter((c) => c.term.trim() || c.definition.trim());
        return [...filtered, ...imported];
      });
    }
    setImportOpen(false);
    setImportText('');
  };

  const validCount = cards.filter((c) => c.term.trim() && c.definition.trim()).length;
  const canSave = title.trim() && validCount > 0;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-100">새 세트 만들기</h1>
            <p className="text-sm text-slate-400 mt-0.5">{validCount}개 카드 준비됨</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setImportOpen(true)}
            size="sm"
          >
            <Import className="w-4 h-4" />
            가져오기
          </Button>
          <Button onClick={handleSave} disabled={!canSave} loading={saving}>
            <Save className="w-4 h-4" />
            저장
          </Button>
        </div>

        {/* Set Info */}
        <div className="glass rounded-2xl p-6 mb-6 card-glow space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              세트 제목 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 영어 단어 - Chapter 1"
              className="w-full bg-transparent text-xl font-semibold text-slate-100 placeholder:text-slate-600 focus:outline-none border-b-2 border-slate-700 focus:border-blue-500 pb-2 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                설명 (선택)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="세트에 대한 간단한 설명"
                className="w-full px-3 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                카테고리 (선택)
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="예: 영어, 수학, 역사"
                className="w-full px-3 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-3 mb-4">
          {cards.map((card, index) => (
            <CardRow
              key={card.id}
              card={card}
              index={index}
              onChange={updateRow}
              onDelete={() => removeRow(card.id)}
              canDelete={cards.length > 1}
            />
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

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="카드 가져오기" size="lg">
        <p className="text-sm text-slate-400 mb-4">
          탭 또는 쉼표로 구분된 텍스트를 붙여넣으세요.<br />
          <span className="text-slate-500">형식: 용어 [탭/쉼표] 정의 [탭/쉼표] 힌트(선택)</span>
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={`apple\t사과\n banana\t바나나, 노란 과일\ncat\t고양이`}
          rows={10}
          className="w-full px-4 py-3 bg-slate-900 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono resize-none transition-all"
        />
        <div className="flex gap-3 justify-end mt-4">
          <Button variant="ghost" onClick={() => setImportOpen(false)}>취소</Button>
          <Button onClick={handleImport} disabled={!importText.trim()}>가져오기</Button>
        </div>
      </Modal>
    </div>
  );
}

interface CardRowProps {
  card: CardInput;
  index: number;
  onChange: (id: string, field: keyof CardInput, value: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function CardRow({ card, index, onChange, onDelete, canDelete }: CardRowProps) {
  return (
    <div className="glass rounded-2xl p-5 card-glow group">
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
              onChange={(e) => onChange(card.id, 'term', e.target.value)}
              placeholder="용어를 입력하세요"
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">정의</label>
            <textarea
              value={card.definition}
              onChange={(e) => onChange(card.id, 'definition', e.target.value)}
              placeholder="정의를 입력하세요"
              rows={2}
              className="w-full px-3 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">힌트 (선택)</label>
            <input
              type="text"
              value={card.hint}
              onChange={(e) => onChange(card.id, 'hint', e.target.value)}
              placeholder="학습 힌트를 추가하세요 (선택)"
              className="w-full px-3 py-2 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder:text-slate-600 border border-slate-700 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="mt-2 p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
