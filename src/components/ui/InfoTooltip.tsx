import { useState, useRef } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  size?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  width?: number;
}

export default function InfoTooltip({ text, size = 13, position = 'top', width = 240 }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const show = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let x = rect.left + rect.width / 2;
    let y = rect.top;

    if (position === 'bottom') y = rect.bottom;
    if (position === 'left') { x = rect.left; y = rect.top + rect.height / 2; }
    if (position === 'right') { x = rect.right; y = rect.top + rect.height / 2; }

    setCoords({ x, y });
    setVisible(true);
  };

  const offsetStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top':    return { left: coords.x, top: coords.y - 10, transform: 'translate(-50%, -100%)' };
      case 'bottom': return { left: coords.x, top: coords.y + 10, transform: 'translateX(-50%)' };
      case 'left':   return { left: coords.x - 10, top: coords.y, transform: 'translate(-100%, -50%)' };
      case 'right':  return { left: coords.x + 10, top: coords.y, transform: 'translateY(-50%)' };
    }
  };

  const arrowStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: 0, height: 0,
    };
    switch (position) {
      case 'top':    return { ...base, bottom: -5, left: '50%', transform: 'translateX(-50%)', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--bg-0)' };
      case 'bottom': return { ...base, top: -5, left: '50%', transform: 'translateX(-50%)', borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderBottom: '5px solid var(--bg-0)' };
      case 'left':   return { ...base, right: -5, top: '50%', transform: 'translateY(-50%)', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '5px solid var(--bg-0)' };
      case 'right':  return { ...base, left: -5, top: '50%', transform: 'translateY(-50%)', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderRight: '5px solid var(--bg-0)' };
    }
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={() => setVisible(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'default',
          color: 'var(--text-3)',
          flexShrink: 0,
          transition: 'color .15s',
        }}
        onMouseOver={e => (e.currentTarget.style.color = 'var(--blue)')}
        onMouseOut={e => { e.currentTarget.style.color = 'var(--text-3)'; setVisible(false); }}
      >
        <Info size={size} />
      </span>

      {visible && (
        <div
          style={{
            position: 'fixed',
            ...offsetStyle(),
            width,
            background: 'var(--bg-0)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 12,
            lineHeight: 1.7,
            color: 'var(--text-2)',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 6px 20px rgba(0,0,0,.3)',
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
