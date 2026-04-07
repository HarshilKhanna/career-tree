'use client';

import { useEffect, useState, type CSSProperties } from 'react';

const OTHERS = 'Others →';

const bubbleBase: CSSProperties = {
  padding: '10px 20px',
  borderRadius: 999,
  border: '1.5px solid #E8E4DC',
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  whiteSpace: 'nowrap',
  background: 'white',
  color: '#1A1A18',
};

function bubbleStyle(selected: boolean, hovered: boolean): CSSProperties {
  if (selected) {
    return {
      ...bubbleBase,
      background: '#1A1A18',
      color: '#F7F5F0',
      borderColor: '#1A1A18',
    };
  }
  return {
    ...bubbleBase,
    borderColor: hovered ? '#2D6A4F' : '#E8E4DC',
  };
}

export interface SelectionBubblesProps {
  question: string;
  options: string[];
  selected: string | null;
  onSelect: (value: string) => void;
  /** When the row is collapsed to a single “Others” pick, click clears so the user can re-pick. */
  onClear?: () => void;
  /** If true, never split into “Others →” (e.g. profile step with exactly 6 options). */
  alwaysShowAllOptions?: boolean;
  /** Horizontal alignment for question + bubble row */
  align?: 'left' | 'center';
}

export default function SelectionBubbles({
  question,
  options,
  selected,
  onSelect,
  onClear,
  alwaysShowAllOptions = false,
  align = 'center',
}: SelectionBubblesProps) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [othersOpen, setOthersOpen] = useState(false);

  useEffect(() => {
    if (selected != null) setOthersOpen(false);
  }, [selected]);

  if (options.length === 0) return null;

  const useOthers = !alwaysShowAllOptions && options.length > 5;
  const first = useOthers ? options.slice(0, 4) : options;
  const rest = useOthers ? options.slice(4) : [];
  const selectedFromRest = selected != null && rest.includes(selected);

  useEffect(() => {
    if (selectedFromRest) setOthersOpen(false);
  }, [selectedFromRest]);

  const showDropdown = useOthers && othersOpen && selected == null;

  const handleBubbleClick = (label: string) => {
    if (label === OTHERS) {
      setOthersOpen(true);
      return;
    }
    onSelect(label);
  };

  const rowStyle: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: align === 'center' ? 'center' : 'flex-start',
  };

  return (
    <div style={{ width: '100%', textAlign: align }}>
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 17,
          fontWeight: 500,
          color: 'var(--color-ink)',
          margin: '0 0 16px 0',
          lineHeight: 1.45,
        }}
      >
        {question}
      </p>

      {showDropdown ? (
        <select
          className="ct-input"
          value=""
          autoFocus
          onChange={(e) => {
            const v = e.target.value;
            if (v) {
              onSelect(v);
              setOthersOpen(false);
            }
          }}
          style={{
            ...bubbleBase,
            width: '100%',
            maxWidth: 320,
            marginLeft: align === 'center' ? 'auto' : undefined,
            marginRight: align === 'center' ? 'auto' : undefined,
            cursor: 'pointer',
            appearance: 'auto',
          }}
        >
          <option value="">Choose an option…</option>
          {rest.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : selectedFromRest ? (
        <div style={rowStyle}>
          <button
            type="button"
            onClick={() => onClear?.()}
            style={bubbleStyle(true, false)}
          >
            {selected}
          </button>
        </div>
      ) : (
        <div style={rowStyle}>
          {first.map((label) => {
            const isSel = selected === label;
            const h = hoverKey === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (isSel && onClear) {
                    onClear();
                    return;
                  }
                  handleBubbleClick(label);
                }}
                onMouseEnter={() => setHoverKey(label)}
                onMouseLeave={() => setHoverKey(null)}
                style={bubbleStyle(isSel, h && !isSel)}
              >
                {label}
              </button>
            );
          })}
          {useOthers ? (
            <button
              type="button"
              onClick={() => handleBubbleClick(OTHERS)}
              onMouseEnter={() => setHoverKey(OTHERS)}
              onMouseLeave={() => setHoverKey(null)}
              style={bubbleStyle(false, hoverKey === OTHERS)}
            >
              {OTHERS}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
