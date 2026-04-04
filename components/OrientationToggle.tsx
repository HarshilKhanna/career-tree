'use client';

import { ArrowLeftRight, ArrowUpDown } from 'lucide-react';

interface OrientationToggleProps {
  orientation: 'horizontal' | 'vertical';
  onChange: (o: 'horizontal' | 'vertical') => void;
  /** When false, show icon-only controls (narrow header). */
  showLabels?: boolean;
}

export default function OrientationToggle({
  orientation,
  onChange,
  showLabels = true,
}: OrientationToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-border)',
        padding: '2px',
        borderRadius: '100px',
        gap: '2px',
      }}
    >
      <button
        type="button"
        onClick={() => onChange('horizontal')}
        title="Horizontal layout"
        aria-label="Horizontal layout"
        aria-pressed={orientation === 'horizontal'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: showLabels ? '6px' : 0,
          padding: showLabels ? '4px 10px' : '6px 10px',
          borderRadius: '100px',
          border: 'none',
          background: orientation === 'horizontal' ? 'white' : 'transparent',
          color: orientation === 'horizontal' ? 'var(--color-ink)' : 'var(--color-ink-muted)',
          boxShadow: orientation === 'horizontal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <ArrowLeftRight size={12} />
        {showLabels ? 'Horizontal' : null}
      </button>
      <button
        type="button"
        onClick={() => onChange('vertical')}
        title="Vertical layout"
        aria-label="Vertical layout"
        aria-pressed={orientation === 'vertical'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: showLabels ? '6px' : 0,
          padding: showLabels ? '4px 10px' : '6px 10px',
          borderRadius: '100px',
          border: 'none',
          background: orientation === 'vertical' ? 'white' : 'transparent',
          color: orientation === 'vertical' ? 'var(--color-ink)' : 'var(--color-ink-muted)',
          boxShadow: orientation === 'vertical' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          fontFamily: 'var(--font-sans)',
          fontSize: '12px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <ArrowUpDown size={12} />
        {showLabels ? 'Vertical' : null}
      </button>
    </div>
  );
}
