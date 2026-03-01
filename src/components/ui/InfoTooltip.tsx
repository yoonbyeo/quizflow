import { useState, useRef } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  size?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  width?: number;
}

export default function InfoTooltip({ text, size = 15, position = 'top', width = 240 }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let x = rect.left + rect.width / 2;
    let y = rect.top;
    if (position === 'bottom') y = rect.bottom;
    if (position === 'left')  { x = rect.left;  y = rect.top + rect.height / 2; }
    if (position === 'right') { x = rect.right; y = rect.top + rect.height / 2; }
    setCoords({ x, y });
    setVisible(true);
  };

  // 약간의 딜레이로 마우스가 툴팁 위로 이동해도 안 사라지게
  const hide = () => {
    hideTimer.current = setTimeout(() => setVisible(false), 120);
  };

  const offsetStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top':    return { left: coords.x, top: coords.y - 12, transform: 'translate(-50%, -100%)' };
      case 'bottom': return { left: coords.x, top: coords.y + 12, transform: 'translateX(-50%)' };
      case 'left':   return { left: coords.x - 12, top: coords.y, transform: 'translate(-100%, -50%)' };
      case 'right':  return { left: coords.x + 12, top: coords.y, transform: 'translateY(-50%)' };
    }
  };

  const arrowStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'absolute', width: 0, height: 0 };
    switch (position) {
      case 'top':    return { ...base, bottom: -6, left: '50%', transform: 'translateX(-50%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid var(--bg-0)' };
      case 'bottom': return { ...base, top: -6,    left: '50%', transform: 'translateX(-50%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid var(--bg-0)' };
      case 'left':   return { ...base, right: -6,  top: '50%',  transform: 'translateY(-50%)', borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '6px solid var(--bg-0)' };
      case 'right':  return { ...base, left: -6,   top: '50%',  transform: 'translateY(-50%)', borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '6px solid var(--bg-0)' };
    }
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'help',
          color: visible ? 'var(--blue)' : 'var(--text-3)',
          flexShrink: 0,
          transition: 'color .15s, background .15s',
          // 클릭 영역을 넉넉하게 확보 (패딩 포함)
          padding: 4,
          borderRadius: '50%',
          background: visible ? 'rgba(99,179,237,.12)' : 'transparent',
          marginLeft: 1,
          marginRight: 1,
        }}
      >
        <Info size={size} strokeWidth={2.2} />
      </span>

      {visible && (
        <div
          onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current); }}
          onMouseLeave={() => setVisible(false)}
          style={{
            position: 'fixed',
            ...offsetStyle(),
            width,
            background: 'var(--bg-0)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '11px 14px',
            fontSize: 12.5,
            lineHeight: 1.75,
            color: 'var(--text-1)',
            zIndex: 9999,
            pointerEvents: 'auto',
            boxShadow: '0 8px 28px rgba(0,0,0,.35)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
          <div style={arrowStyle()} />
        </div>
      )}
    </>
  );
}
