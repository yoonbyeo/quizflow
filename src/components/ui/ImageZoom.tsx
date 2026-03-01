import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt?: string;
  /** 썸네일로 보여줄 스타일 */
  style?: React.CSSProperties;
  className?: string;
}

/** 확대 모달 */
function ZoomModal({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 }); // transform-origin %
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  // ESC 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 스크롤 확대/축소
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(s => Math.min(6, Math.max(0.5, s - e.deltaY * 0.001)));
  };

  // 클릭 확대
  const handleImgClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ox = ((e.clientX - rect.left) / rect.width) * 100;
    const oy = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x: ox, y: oy });
    setScale(s => s < 1.5 ? 2.5 : 1);
    if (scale >= 1.5) setPos({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    setDragging(false);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setDragging(true);
    setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
  };
  const handleMouseUp = () => { dragStart.current = null; };

  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* 툴바 */}
      <div style={{
        position: 'fixed', top: 16, right: 16, display: 'flex', alignItems: 'center', gap: 8, zIndex: 1001,
      }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontWeight: 600, minWidth: 44, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>
        <button onClick={() => setScale(s => Math.min(6, s + 0.5))}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomIn size={16} />
        </button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.5))}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ZoomOut size={16} />
        </button>
        <button onClick={reset}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RotateCcw size={14} />
        </button>
        <button onClick={onClose}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} />
        </button>
      </div>

      {/* 힌트 */}
      {scale === 1 && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: 'rgba(255,255,255,.45)', pointerEvents: 'none' }}>
          클릭하여 확대 · 스크롤로 조절 · ESC로 닫기
        </div>
      )}

      {/* 이미지 영역 */}
      <div
        style={{ overflow: 'hidden', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: scale > 1 ? 'grab' : 'zoom-in' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={src}
          alt={alt}
          onClick={handleImgClick}
          draggable={false}
          style={{
            maxWidth: '88vw',
            maxHeight: '88vh',
            objectFit: 'contain',
            borderRadius: 10,
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: `${origin.x}% ${origin.y}%`,
            transition: dragging ? 'none' : 'transform .25s cubic-bezier(.4,0,.2,1)',
            userSelect: 'none',
            boxShadow: '0 24px 80px rgba(0,0,0,.7)',
          }}
        />
      </div>
    </div>
  );
}

/** 썸네일 + 클릭 시 확대 모달 */
export default function ImageZoom({ src, alt, style, className }: ImageZoomProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-block', cursor: 'zoom-in' }}
        onClick={e => { e.stopPropagation(); setOpen(true); }}>
        <img src={src} alt={alt} style={style} className={className} draggable={false} />
        {/* 확대 힌트 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: (style as any)?.borderRadius ?? 8,
          background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .15s',
          opacity: 0,
        }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.opacity = '1';
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,.35)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.opacity = '0';
            (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0)';
          }}
        >
          <ZoomIn size={20} color="#fff" />
        </div>
      </div>

      {open && <ZoomModal src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
