'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TreeMetadata, AnalyticsStore } from '@/lib/types';

function displayOrNA(value: string | null | undefined): string {
  if (!value || value.trim() === "") return "N/A";
  return value;
}

function toTitleCase(slug: string): string {
  return slug
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function hasRealValue(value: string | null | undefined): value is string {
  return Boolean(value && value.trim() !== '' && value.trim().toLowerCase() !== 'n/a');
}

function getProfileKeyFromId(id: string): string {
  const treeId = id.toLowerCase();
  if (treeId.startsWith('inschool_')) return 'inschool';
  if (treeId.startsWith('bachelors_exp_')) return 'bachelors_exp';
  if (treeId.startsWith('bachelors_')) return 'bachelors';
  if (treeId.startsWith('masters_exp_')) return 'masters_exp';
  if (treeId.startsWith('masters_')) return 'masters';
  if (treeId.startsWith('exp2plus_')) return 'exp2plus';
  return 'legacy';
}

function getInputTypeLabel(tree: TreeMetadata): string {
  const id = tree.id.toLowerCase();
  if (id.startsWith('inschool_')) {
    const streamLabel = displayOrNA(tree.stream);
    return streamLabel === 'N/A' ? 'In-school' : `In-school (${streamLabel})`;
  }
  if (id.startsWith('bachelors_exp_')) return "Bachelor's + under 2 years work ex";
  if (id.startsWith('bachelors_')) return "Bachelor's student / fresh graduate";
  if (id.startsWith('masters_exp_')) return "Master's + under 2 years work ex";
  if (id.startsWith('masters_')) return "Master's student / fresh graduate";
  if (id.startsWith('exp2plus_')) return 'More than 2 years of work ex';

  if (tree.level === 'school') return 'In-school';
  if (tree.level === 'undergraduate') return "Bachelor's student / fresh graduate";
  return "Master's student / fresh graduate";
}

type ParsedInputRow = {
  experience: string;
  workDomain: string;
  ugDegree: string;
  ugSpecialization: string;
  mastersDegree: string;
  mastersSpecialization: string;
  mostRecentProfile: string;
};

function parseInputRow(tree: TreeMetadata): ParsedInputRow {
  const profile = getProfileKeyFromId(tree.id);
  const idTokens = tree.id.toLowerCase().split('_').filter(Boolean);
  const lastToken = idTokens.length > 0 ? idTokens[idTokens.length - 1] : '';

  const row: ParsedInputRow = {
    experience: 'N/A',
    workDomain: 'N/A',
    ugDegree: 'N/A',
    ugSpecialization: 'N/A',
    mastersDegree: 'N/A',
    mastersSpecialization: 'N/A',
    mostRecentProfile: 'N/A',
  };

  if (profile === 'inschool') {
    return row;
  }

  if (profile === 'bachelors') {
    row.ugDegree = displayOrNA(tree.degree);
    row.ugSpecialization = displayOrNA(tree.stream);
    return row;
  }

  if (profile === 'bachelors_exp') {
    row.experience = 'Under 2 years';
    row.workDomain = lastToken ? toTitleCase(lastToken) : 'N/A';
    row.ugDegree = displayOrNA(tree.degree);
    row.ugSpecialization = displayOrNA(tree.stream);
    return row;
  }

  if (profile === 'masters') {
    row.ugDegree = displayOrNA(tree.ugDegree);
    row.ugSpecialization = displayOrNA(tree.ugStream);
    row.mastersDegree = displayOrNA(tree.degree);
    row.mastersSpecialization = displayOrNA(tree.stream);
    return row;
  }

  if (profile === 'masters_exp') {
    row.experience = 'Under 2 years';
    row.workDomain = lastToken ? toTitleCase(lastToken) : 'N/A';
    row.ugDegree = displayOrNA(tree.ugDegree);
    row.ugSpecialization = displayOrNA(tree.ugStream);
    row.mastersDegree = displayOrNA(tree.degree);
    row.mastersSpecialization = displayOrNA(tree.stream);
    return row;
  }

  if (profile === 'exp2plus') {
    row.experience = 'More than 2 years';
    row.mostRecentProfile = lastToken ? toTitleCase(lastToken) : 'N/A';

    const deg = tree.degree;
    if (deg.includes('→')) {
      const [ug, masters] = deg.split('→').map((s) => s.trim());
      row.ugDegree = displayOrNA(ug);
      row.mastersDegree = displayOrNA(masters);
    } else {
      row.ugDegree = displayOrNA(deg);
    }

    const streamParts = (tree.stream || '').split('—').map((s) => s.trim()).filter(Boolean);
    if (streamParts.length > 0) row.ugSpecialization = displayOrNA(streamParts[0]);
    if (streamParts.length > 1) row.mastersSpecialization = displayOrNA(streamParts[1]);
    if (streamParts.length > 2) row.mostRecentProfile = displayOrNA(streamParts[2]);
    return row;
  }

  if (tree.level === 'undergraduate') {
    row.ugDegree = displayOrNA(tree.degree);
    row.ugSpecialization = displayOrNA(tree.stream);
  } else if (tree.level === 'masters') {
    row.mastersDegree = displayOrNA(tree.degree);
    row.mastersSpecialization = displayOrNA(tree.stream);
  }
  return row;
}

export default function AdminPage() {
  const router = useRouter();
  const [trees, setTrees] = useState<TreeMetadata[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsStore>({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'analytics'>('library');
  const [search, setSearch] = useState('');

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

  const filteredTrees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return trees.filter((tree) => {
      if (!query) return true;
      const input = parseInputRow(tree);
      const haystack = [
        tree.id,
        tree.degree,
        tree.stream ?? '',
        getInputTypeLabel(tree),
        input.ugDegree,
        input.ugSpecialization,
        input.mastersDegree,
        input.mastersSpecialization,
        input.experience,
        input.mostRecentProfile,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [trees, search]);

  return (
    <main
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: '0',
        padding: '24px',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
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
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border)', marginBottom: '16px', flexShrink: 0 }}>
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

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: 0 }}>
            {trees.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '16px',
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
                  <div style={{ fontSize: '16px', fontFamily: 'var(--font-sans)', fontWeight: 500, marginTop: '8px', lineHeight: 1.3 }}>
                    {trees.length > 0 ? (() => {
                      const mostViewed = trees.reduce((prev, current) => {
                        return (analytics[current.id]?.treeViews || 0) > (analytics[prev.id]?.treeViews || 0) ? current : prev;
                      });
                      return getInputTypeLabel(mostViewed);
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
                overflow: 'auto',
                minHeight: 0,
              }}
            >
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Profile</th>
                    <th>Details</th>
                    <th>Views</th>
                    <th>Nodes</th>
                  </tr>
                </thead>
                <tbody>
                  {trees.map((tree) => {
                    const input = parseInputRow(tree);
                    const chips = [
                      { label: 'UG Degree', value: input.ugDegree },
                      { label: 'UG Spec', value: input.ugSpecialization },
                      { label: 'Masters', value: input.mastersDegree },
                      { label: 'Masters Spec', value: input.mastersSpecialization },
                      { label: 'Experience', value: input.experience },
                      { label: 'Domain', value: input.workDomain },
                      { label: 'Role', value: input.mostRecentProfile },
                    ].filter((f) => hasRealValue(f.value));
                    return (
                      <tr key={tree.id}>
                        <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{getInputTypeLabel(tree)}</td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {chips.length === 0 ? (
                              <span style={{ color: 'var(--color-ink-muted)', fontSize: '12px' }}>—</span>
                            ) : chips.map((chip) => (
                              <span
                                key={chip.label}
                                style={{
                                  fontFamily: 'var(--font-sans)',
                                  fontSize: '11px',
                                  background: 'var(--color-paper)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  color: 'var(--color-ink)',
                                }}
                              >
                                <span style={{ color: 'var(--color-ink-muted)', marginRight: '3px' }}>{chip.label}:</span>
                                {chip.value}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', background: 'var(--color-paper)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '4px' }}>
                            {analytics[tree.id]?.treeViews || 0}
                          </span>
                        </td>
                        <td>{tree.nodeCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Library Tab Content */}
        {activeTab === 'library' && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            gap: '12px',
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
          <>
            {/* Filter bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                alignItems: 'center',
                padding: '10px 4px',
              }}
            >
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by input, degree, specialisation, or profile…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  maxWidth: '520px',
                  borderRadius: '999px',
                  border: '1px solid var(--color-border)',
                  padding: '8px 14px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                }}
              />
              <div
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  color: 'var(--color-ink-muted)',
                }}
              >
                {filteredTrees.length} tree{filteredTrees.length === 1 ? '' : 's'}
              </div>
            </div>

            <div style={{ overflow: 'auto', minHeight: 0, flex: 1, padding: '8px 4px 4px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '14px',
                }}
              >
                {filteredTrees.map((tree) => {
                  const input = parseInputRow(tree);
                  const fieldChips = [
                    { label: 'UG Degree', value: input.ugDegree },
                    { label: 'UG Specialization', value: input.ugSpecialization },
                    { label: 'Masters Degree', value: input.mastersDegree },
                    { label: 'Masters Specialization', value: input.mastersSpecialization },
                    { label: 'Work Experience', value: input.experience },
                    { label: 'Work Domain', value: input.workDomain },
                    { label: 'Most Recent Profile', value: input.mostRecentProfile },
                  ].filter((f) => hasRealValue(f.value));

                  return (
                    <article
                      key={tree.id}
                      style={{
                        background: 'white',
                        border: '1px solid var(--color-border)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          gap: '10px',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 500, color: 'var(--color-ink)' }}>
                          {getInputTypeLabel(tree)}
                        </div>
                      </div>

                      {fieldChips.length > 0 && (
                        <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                              gap: '8px',
                            }}
                          >
                            {fieldChips.map((chip) => (
                              <div
                                key={chip.label}
                                style={{
                                  border: '1px solid var(--color-border)',
                                  background: 'var(--color-paper)',
                                  borderRadius: '8px',
                                  padding: '8px',
                                }}
                              >
                                <div
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '10px',
                                    textTransform: 'uppercase',
                                    color: 'var(--color-ink-muted)',
                                    letterSpacing: '0.04em',
                                    marginBottom: '4px',
                                  }}
                                >
                                  {chip.label}
                                </div>
                                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-ink)', lineHeight: 1.35 }}>
                                  {chip.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ flex: 1 }} />

                      <div
                        style={{
                          borderTop: '1px solid var(--color-border)',
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '12px',
                              background: 'var(--color-paper)',
                              border: '1px solid var(--color-border)',
                              padding: '2px 8px',
                              borderRadius: '999px',
                            }}
                          >
                            {tree.nodeCount}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-ink-muted)' }}>
                            {formatDate(tree.updatedAt)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" onClick={() => router.push(`/admin/${tree.id}`)} style={{ fontSize: '12px', padding: '5px 12px' }}>
                            <Pencil size={11} /> Edit
                          </button>
                          <button className="btn-danger" onClick={() => setDeleteTarget(tree.id)} style={{ fontSize: '12px', padding: '5px 12px' }}>
                            <Trash2 size={11} /> Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

          </>
        )}
      </div>
      )}
      </div>

      {/* Back to site */}
      <div style={{ marginTop: '16px', flexShrink: 0 }}>
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

      {deleteTarget && (
        <div
          onClick={() => setDeleteTarget(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 26, 24, 0.35)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(520px, 100%)',
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-dropdown)',
              padding: '18px 18px 16px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--color-ink)',
              }}
            >
              Confirm deletion
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--color-ink-muted)',
                marginBottom: '14px',
              }}
            >
              Delete this tree and all its nodes? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn-ghost"
                style={{ fontSize: '12px' }}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                style={{ fontSize: '12px', padding: '6px 12px' }}
                onClick={() => handleDelete(deleteTarget)}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
