'use client';

import Link from 'next/link';
import { ArrowLeft, Plus, Minus, Home, Settings } from 'lucide-react';

interface HeaderProps {
  breadcrumb?: string;
  showBack?: boolean;
  showZoom?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  centerContent?: React.ReactNode;
}

export default function Header({
  breadcrumb,
  showBack = false,
  showZoom = false,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  centerContent,
}: HeaderProps) {
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
        justifyContent: 'space-between',
        paddingInline: '24px',
        zIndex: 100,
        gap: '16px',
      }}
    >
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '18px',
            color: 'var(--color-ink)',
            textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}
        >
          CareerTree
        </Link>
        {breadcrumb && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-ink-muted)',
              paddingLeft: '12px',
              borderLeft: '1px solid var(--color-border)',
            }}
          >
            {breadcrumb}
          </span>
        )}
      </div>

      {/* Center */}
      {centerContent && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          {centerContent}
        </div>
      )}

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {showZoom && (
          <>
            <button
              className="btn-ghost"
              onClick={onZoomIn}
              title="Zoom in"
              style={{ padding: '6px 8px' }}
            >
              <Plus size={15} />
            </button>
            <button
              className="btn-ghost"
              onClick={onZoomOut}
              title="Zoom out"
              style={{ padding: '6px 8px' }}
            >
              <Minus size={15} />
            </button>
            <button
              className="btn-ghost"
              onClick={onZoomReset}
              title="Reset view"
              style={{ padding: '6px 8px' }}
            >
              <Home size={15} />
            </button>
            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--color-border)',
                margin: '0 4px',
              }}
            />
          </>
        )}
        <div
          style={{
            width: '1px',
            height: '20px',
            background: 'var(--color-border)',
            margin: '0 4px',
          }}
        />
        <Link 
          href="/admin" 
          className="btn-ghost" 
          title="Admin Panel"
          style={{ 
            textDecoration: 'none', 
            gap: '6px',
            color: 'var(--color-ink-muted)',
            fontSize: '12px'
          }}
        >
          <Settings size={14} />
          Admin
        </Link>
        {showBack && (
          <Link href="/" className="btn-secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={13} />
            Back
          </Link>
        )}
      </div>
    </header>
  );
}
