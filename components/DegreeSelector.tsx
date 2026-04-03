'use client';

import { ChevronDown } from 'lucide-react';

const DEGREES = [
  'B.Tech',
  'B.Sc.',
  'B.Com',
  'B.A.',
  'BBA',
  'B.Arch',
  'B.Pharm',
  'MBBS',
  'LLB',
  'BCA',
  'B.Des.',
];

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'Singapore',
  'UAE',
];

interface DegreeSelectorProps {
  degree: string;
  country: string;
  onDegreeChange: (v: string) => void;
  onCountryChange: (v: string) => void;
}

export default function DegreeSelector({
  degree,
  country,
  onDegreeChange,
  onCountryChange,
}: DegreeSelectorProps) {
  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 44px 14px 16px',
    fontFamily: 'var(--font-sans)',
    fontSize: '15px',
    color: 'var(--color-ink)',
    background: 'white',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    cursor: 'pointer',
    appearance: 'none' as const,
    transition: 'border-color 0.15s, box-shadow 0.15s',
    outline: 'none',
  };

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-accent)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(45, 106, 79, 0.1)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-border)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '480px' }}>
      {/* Degree */}
      <div style={{ flex: 1 }}>
        <label
          htmlFor="degree-select"
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
            marginBottom: '8px',
          }}
        >
          Degree
        </label>
        <div className="ct-select-wrapper">
          <select
            id="degree-select"
            value={degree}
            onChange={(e) => onDegreeChange(e.target.value)}
            style={selectStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="">Select degree…</option>
            {DEGREES.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown size={14} className="chevron" />
        </div>
      </div>

      {/* Country */}
      <div style={{ flex: 1 }}>
        <label
          htmlFor="country-select"
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
            marginBottom: '8px',
          }}
        >
          Country
        </label>
        <div className="ct-select-wrapper">
          <select
            id="country-select"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            style={selectStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={14} className="chevron" />
        </div>
      </div>
    </div>
  );
}
