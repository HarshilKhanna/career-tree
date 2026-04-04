'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TreeMetadata, AnalyticsStore, TreeAnalytics } from '@/lib/types';
import { Fragment } from "react";
import { formatLevelLabel } from '@/lib/treeConfig';

export default function AdminPage() {
  const router = useRouter();
  const [trees, setTrees] = useState<TreeMetadata[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsStore>({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'analytics'>('library');

  const fetchTrees = async () => {
    const [tRes, aRes] = await Promise.all([
      fetch('/api/trees'),
      fetch('/api/analytics')
    ]);
    const tData = await tRes.json();
    const aData = await aRes.json();
    setTrees(tData);
    setAnalytics(aData);
    setLoading(false);
  };

  useEffect(() => { fetchTrees(); }, []);

  const handleDelete = async (id: string) => {
    await fetch(`/api/trees/${id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    fetchTrees();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  return (
    <main
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: 'clamp(64px, 12vw, 80px) clamp(16px, 4vw, 24px) 48px',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '36px',
              color: 'var(--color-ink)',
              letterSpacing: '-0.02em',
            }}
          >
            Tree Library
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: 'var(--color-ink-muted)',
              marginTop: '6px',
            }}
          >
            Manage career path trees. Changes persist to{' '}
            <code
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                background: 'var(--color-border)',
                padding: '1px 6px',
                borderRadius: '3px',
              }}
            >
              /data/trees.json
            </code>
          </p>
        </div>
        <Link
          href="/admin/new"
          className="btn-primary"
          style={{ textDecoration: 'none', flexShrink: 0 }}
        >
          <Plus size={14} /> New Tree
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '32px' }}>
        <button 
          onClick={() => setActiveTab('library')}
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '15px', fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: 'pointer',
            color: activeTab === 'library' ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            borderBottom: activeTab === 'library' ? '2px solid var(--color-ink)' : '2px solid transparent'
          }}
        >
          Tree Library
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0', fontSize: '15px', fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: 'pointer',
            color: activeTab === 'analytics' ? 'var(--color-ink)' : 'var(--color-ink-muted)',
            borderBottom: activeTab === 'analytics' ? '2px solid var(--color-ink)' : '2px solid transparent'
          }}
        >
          Analytics & Usage
        </button>
      </div>

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && !loading && (
        <>
          {/* Top Stats Row */}
          {trees.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
          <div className="ct-card" style={{ padding: '20px', cursor: 'default' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>Total Trees</div>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', marginTop: '8px' }}>{trees.length}</div>
          </div>
          <div className="ct-card" style={{ padding: '20px', cursor: 'default' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>Total Nodes</div>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', marginTop: '8px' }}>
              {trees.reduce((acc, t) => acc + (t.nodeCount || 0), 0)}
            </div>
          </div>
          <div className="ct-card" style={{ padding: '20px', cursor: 'default' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase' }}>Most Viewed Tree</div>
            <div style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', marginTop: '8px', lineHeight: 1.2 }}>
              {trees.length > 0 ? (() => {
                const mostViewed = trees.reduce((prev, current) => {
                  return (analytics[current.id]?.treeViews || 0) > (analytics[prev.id]?.treeViews || 0) ? current : prev;
                });
                return `${mostViewed.degree} ${mostViewed.country}`;
              })() : 'N/A'}
            </div>
          </div>
        </div>
      )}

          <div
            style={{
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              overflowX: 'auto',
            }}
          >
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Degree & Stream</th>
                  <th>Country</th>
                  <th>Total Views</th>
                  <th>Nodes Indexed</th>
                </tr>
              </thead>
              <tbody>
                {trees.map((tree) => (
                  <tr key={tree.id}>
                    <td style={{ fontWeight: 500 }}>{tree.degree} {tree.stream ? `— ${tree.stream}` : ''}</td>
                    <td>{tree.country}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'var(--color-paper)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '4px' }}>
                        {analytics[tree.id]?.treeViews || 0}
                      </span>
                    </td>
                    <td>{tree.nodeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Library Tab Content */}
      {activeTab === 'library' && (
        <div
          style={{
            background: 'white',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
        {loading ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--color-ink-muted)',
            }}
          >
            Loading…
          </div>
        ) : trees.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: 'var(--color-ink-muted)',
            }}
          >
            No trees yet.{' '}
            <Link href="/admin/new" style={{ color: 'var(--color-accent)' }}>
              Create one →
            </Link>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Degree</th>
                <th>Stream</th>
                <th>Country</th>
                <th>Level</th>
                <th>Nodes</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trees.map((tree) => (
                <Fragment key={tree.id}>
                  <tr key={tree.id}>
                    <td style={{ fontWeight: 500 }}>{tree.degree}</td>
                    <td>{tree.stream || '-'}</td>
                    <td>{tree.country}</td>
                    <td>{formatLevelLabel(tree.level)}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'var(--color-paper)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '4px' }}>
                        {tree.nodeCount}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                      {formatDate(tree.updatedAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={() => router.push(`/admin/${tree.id}`)} style={{ fontSize: '12px', padding: '5px 12px' }}>
                          <Pencil size={11} /> Edit
                        </button>
                        <button className="btn-danger" onClick={() => setDeleteTarget(tree.id)} style={{ fontSize: '12px', padding: '5px 12px' }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  {deleteTarget === tree.id && (
                    <tr key={`${tree.id}-confirm`}>
                      <td colSpan={8} style={{ background: '#FEF2F2', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#B91C1C' }}>
                          <span>Delete &quot;{tree.degree} — {tree.country}&quot; and all its nodes?</span>
                          <button className="btn-danger" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => handleDelete(tree.id)}>Confirm Delete</button>
                          <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={() => setDeleteTarget(null)}>Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {/* Back to site */}
      <div style={{ marginTop: '32px' }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--color-ink-muted)',
            textDecoration: 'none',
          }}
        >
          ← Back to site
        </Link>
      </div>
    </main>
  );
}
