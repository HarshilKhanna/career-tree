'use client';

import { useState, useCallback } from 'react';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CareerNode } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import {
  insertNode,
  updateNode,
  deleteNode,
} from '@/lib/treeUtils';

interface AdminNodeEditorProps {
  root: CareerNode;
  onTreeChange: (newRoot: CareerNode) => void;
}

interface NodeFormProps {
  node: CareerNode;
  onSave: (updated: Partial<CareerNode>) => void;
  onAddChild: () => void;
}

function NodeForm({ node, onSave, onAddChild }: NodeFormProps) {
  const [form, setForm] = useState({
    name: node.name,
    description: node.description,
    skills: (node.skills || []).join(', '),
    salaryRange: node.salaryRange || '',
    roadmap: node.roadmap || '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({
      name: form.name,
      description: form.description,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      salaryRange: form.salaryRange,
      roadmap: form.roadmap,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label className="form-label">Name</label>
        <input
          className="ct-input"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Description</label>
        <textarea
          className="ct-input ct-textarea"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>
      <div>
        <label className="form-label">Skills (comma-separated)</label>
        <input
          className="ct-input"
          value={form.skills}
          onChange={(e) => handleChange('skills', e.target.value)}
          placeholder="React, TypeScript, Node.js"
        />
      </div>
      <div>
        <label className="form-label">Salary Range</label>
        <input
          className="ct-input"
          value={form.salaryRange}
          onChange={(e) => handleChange('salaryRange', e.target.value)}
          placeholder="₹8L – ₹25L / yr"
        />
      </div>
      <div>
        <label className="form-label">Roadmap</label>
        <textarea
          className="ct-input ct-textarea"
          value={form.roadmap}
          onChange={(e) => handleChange('roadmap', e.target.value)}
          style={{ minHeight: '100px' }}
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={handleSave} style={{ flex: 1, justifyContent: 'center' }}>
          Save Changes
        </button>
        <button className="btn-secondary" onClick={onAddChild} style={{ gap: '6px' }}>
          <Plus size={13} /> Add Child
        </button>
      </div>
    </div>
  );
}

interface TreeNavItemProps {
  node: CareerNode;
  selectedId: string | null;
  onSelect: (node: CareerNode) => void;
  onDelete: (id: string) => void;
  depth: number;
}

function TreeNavItem({ node, selectedId, onSelect, onDelete, depth }: TreeNavItemProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        {hasChildren ? (
          <motion.button
            className="btn-ghost"
            style={{ padding: '2px 4px', color: 'var(--color-ink-muted)' }}
            onClick={() => setExpanded((e) => !e)}
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={12} />
          </motion.button>
        ) : (
          <span style={{ width: '20px', display: 'inline-block' }} />
        )}

        <div
          className={`tree-nav-node${selectedId === node.id ? ' active' : ''}`}
          style={{ flex: 1, paddingLeft: `${depth * 4}px` }}
          onClick={() => onSelect(node)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(node)}
        >
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.name}
          </span>
        </div>

        {depth > 0 && (
          <button
            className="btn-ghost"
            style={{ padding: '2px 4px', flexShrink: 0 }}
            onClick={() => setConfirmDelete(true)}
            title="Delete node"
          >
            <Trash2 size={11} color="var(--color-ink-muted)" />
          </button>
        )}
      </div>

      {confirmDelete && (
        <div
          style={{
            margin: '4px 0 4px 28px',
            padding: '8px 12px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#B91C1C',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <span>Delete &quot;{node.name}&quot; and all its children?</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-danger"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => {
                onDelete(node.id);
                setConfirmDelete(false);
              }}
            >
              Delete
            </button>
            <button
              className="btn-ghost"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ paddingLeft: '8px', overflow: 'hidden' }}
          >
            {node.children.map((child) => (
              <TreeNavItem
                key={child.id}
                node={child}
                selectedId={selectedId}
                onSelect={onSelect}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminNodeEditor({ root, onTreeChange }: AdminNodeEditorProps) {
  const [selectedNode, setSelectedNode] = useState<CareerNode | null>(null);

  const handleSelect = useCallback((node: CareerNode) => {
    setSelectedNode(node);
  }, []);

  const handleSave = useCallback(
    (updates: Partial<CareerNode>) => {
      if (!selectedNode) return;
      const newRoot = updateNode(root, selectedNode.id, updates);
      onTreeChange(newRoot);
      setSelectedNode({ ...selectedNode, ...updates });
    },
    [selectedNode, root, onTreeChange]
  );

  const handleAddChild = useCallback(() => {
    if (!selectedNode) return;
    const newChild: CareerNode = {
      id: uuidv4(),
      name: 'New Node',
      description: '',
      skills: [],
      salaryRange: '',
      roadmap: '',
      children: [],
    };
    const newRoot = insertNode(root, selectedNode.id, newChild);
    onTreeChange(newRoot);
  }, [selectedNode, root, onTreeChange]);

  const handleDelete = useCallback(
    (id: string) => {
      const newRoot = deleteNode(root, id);
      onTreeChange(newRoot);
      if (selectedNode?.id === id) setSelectedNode(null);
    },
    [root, onTreeChange, selectedNode]
  );

  return (
    <div style={{ display: 'flex', gap: '0', height: '100%', overflow: 'hidden' }}>
      {/* Nav panel */}
      <div
        style={{
          width: '40%',
          borderRight: '1px solid var(--color-border)',
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          Tree Navigator
        </div>
        <TreeNavItem
          node={root}
          selectedId={selectedNode?.id ?? null}
          onSelect={handleSelect}
          onDelete={handleDelete}
          depth={0}
        />
      </div>

      {/* Form panel */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}
      >
        {selectedNode ? (
          <>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--color-ink-muted)',
                marginBottom: '20px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              Editing: {selectedNode.name}
            </div>
            <NodeForm
              key={selectedNode.id}
              node={selectedNode}
              onSave={handleSave}
              onAddChild={handleAddChild}
            />
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: 'var(--color-ink-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            Select a node from the tree navigator to edit it
          </div>
        )}
      </div>

      <style>{`
        .form-label {
          display: block;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--color-ink-muted);
          margin-bottom: 6px;
        }
      `}</style>
    </div>
  );
}
