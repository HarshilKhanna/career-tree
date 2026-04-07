'use client';

import { useEffect, useState } from 'react';
import { CareerTree } from '@/lib/types';
import AdminUploader from '@/components/AdminUploader';
import { treeToText } from '@/lib/treeUtils';

export default function AdminTreeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [tree, setTree] = useState<CareerTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [treeId, setTreeId] = useState<string>('');

  useEffect(() => {
    params.then(({ id }) => setTreeId(id));
  }, [params]);

  useEffect(() => {
    if (!treeId) return;
    fetch(`/api/trees/${treeId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data: CareerTree) => {
        setTree(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load this tree.');
        setLoading(false);
      });
  }, [treeId]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          color: 'var(--color-ink-muted)',
        }}
      >
        Loading editor…
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
        }}
      >
        <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-ink-muted)' }}>
          {error || 'Tree not found.'}
        </p>
      </div>
    );
  }

  return (
    <AdminUploader
      initialText={treeToText(tree)}
      isEdit
      originalTreeId={treeId}
      editBaseline={{
        id: tree.id,
        createdAt: tree.createdAt,
        country: tree.country,
        ugDegree: tree.ugDegree,
        ugStream: tree.ugStream,
      }}
    />
  );
}
