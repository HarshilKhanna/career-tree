'use client';

import { ArrowLeftRight, ArrowUpDown } from 'lucide-react';

interface OrientationToggleProps {
  orientation: 'horizontal' | 'vertical';
  onChange: (o: 'horizontal' | 'vertical') => void;
}

export default function OrientationToggle({ orientation, onChange }: OrientationToggleProps) {
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
        onClick={() => onChange('horizontal')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
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
        Horizontal
      </button>
      <button
        onClick={() => onChange('vertical')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
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
        Vertical
      </button>
    </div>
  );
}
