'use client';

import Link from 'next/link';
import { ArrowLeft, Plus, Minus, Home, Settings } from 'lucide-react';

export type HeaderMode = 'full' | 'minimal';

interface HeaderProps {
  /** `minimal` — hide breadcrumb; tighter toolbar (mobile). */
  mode?: HeaderMode;
  breadcrumb?: string;
  showBack?: boolean;
  showZoom?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  centerContent?: React.ReactNode;
  showAdminLink?: boolean;
  /** Smaller zoom icons / padding (e.g. mobile header). */
  compactToolbar?: boolean;
  /** Renders at the start of the right toolbar (before zoom), e.g. compact orientation. */
  trailingToolbarStart?: React.ReactNode;
}

export default function Header({
  mode = 'full',
  breadcrumb,
  showBack = false,
  showZoom = false,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  centerContent,
  showAdminLink = true,
  compactToolbar = false,
  trailingToolbarStart,
}: HeaderProps) {
  const minimal = mode === 'minimal';
  const compact = compactToolbar || minimal;
  const zoomPad = compact ? '4px 6px' : '6px 8px';
  const iconSz = compact ? 14 : 15;

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        background: 'rgba(247, 245, 240, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'nowrap',
        gap: compact ? 6 : 10,
        paddingInline: 'clamp(8px, 2.5vw, 24px)',
        zIndex: 100,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <Link
        href="/"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(16px, 3.5vw, 18px)',
          color: 'var(--color-ink)',
          textDecoration: 'none',
          letterSpacing: '-0.02em',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        CareerTree
      </Link>

      {!minimal && breadcrumb ? (
        <span
          title={breadcrumb}
          style={{
            minWidth: 0,
            flex: '1 1 0%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-ink-muted)',
            paddingLeft: '10px',
            borderLeft: '1px solid var(--color-border)',
          }}
        >
          {breadcrumb}
        </span>
      ) : null}

      {!minimal && centerContent ? (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{centerContent}</div>
      ) : null}

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          flexShrink: 0,
          gap: compact ? 2 : 4,
          minWidth: 0,
        }}
      >
        {trailingToolbarStart ? (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{trailingToolbarStart}</div>
        ) : null}

        {showZoom ? (
          <>
            {trailingToolbarStart ? (
              <div
                style={{
                  width: '1px',
                  height: '18px',
                  background: 'var(--color-border)',
                  margin: '0 2px',
                  flexShrink: 0,
                }}
              />
            ) : null}
            <button
              type="button"
              className="btn-ghost"
              onClick={onZoomIn}
              title="Zoom in"
              aria-label="Zoom in"
              style={{ padding: zoomPad, flexShrink: 0 }}
            >
              <Plus size={iconSz} />
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={onZoomOut}
              title="Zoom out"
              aria-label="Zoom out"
              style={{ padding: zoomPad, flexShrink: 0 }}
            >
              <Minus size={iconSz} />
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={onZoomReset}
              title="Reset view"
              aria-label="Reset view"
              style={{ padding: zoomPad, flexShrink: 0 }}
            >
              <Home size={iconSz} />
            </button>
            <div
              style={{
                width: '1px',
                height: '18px',
                background: 'var(--color-border)',
                margin: '0 4px',
                flexShrink: 0,
              }}
            />
          </>
        ) : null}

        {trailingToolbarStart && !showZoom && (showAdminLink || showBack) ? (
          <div
            style={{
              width: '1px',
              height: '18px',
              background: 'var(--color-border)',
              margin: '0 4px',
              flexShrink: 0,
            }}
          />
        ) : null}

        {showAdminLink ? (
          <Link
            href="/admin"
            className="btn-ghost"
            title="Admin Panel"
            style={{
              textDecoration: 'none',
              gap: compact ? 4 : 6,
              color: 'var(--color-ink-muted)',
              fontSize: compact ? '11px' : '12px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              padding: compact ? '4px 6px' : undefined,
            }}
          >
            <Settings size={compact ? 13 : 14} />
            <span className="header-admin-text">Admin</span>
          </Link>
        ) : null}

        {showAdminLink && showBack ? (
          <div
            style={{
              width: '1px',
              height: '18px',
              background: 'var(--color-border)',
              margin: '0 4px',
              flexShrink: 0,
            }}
          />
        ) : null}

        {showBack ? (
          <Link
            href="/"
            className="btn-secondary"
            style={{
              textDecoration: 'none',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: compact ? 4 : 6,
              padding: compact ? '6px 10px' : undefined,
              fontSize: compact ? '12px' : undefined,
            }}
            aria-label="Back to home"
          >
            <ArrowLeft size={compact ? 12 : 13} />
            <span>Back</span>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
