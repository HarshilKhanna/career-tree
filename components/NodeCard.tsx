'use client';

import { memo, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { CareerNode } from '@/lib/types';
import type { CareerNodeFlowData } from '@/lib/toReactFlowElements';

export type CareerNodeData = CareerNodeFlowData & {
  onNodeClick: (node: CareerNode) => void;
  toggleNode: (nodeId: string) => void;
  selectedNodeId: string | null;
  nodeScores?: Record<string, number>;
};

type CareerNodeNode = Node<CareerNodeData> & { type: 'careerNode' };

function heatmapBorderStyles(
  nodeId: string,
  nodeScores: Record<string, number> | undefined
): { borderWidth: string; borderColor: string } | undefined {
  if (!nodeScores) return undefined;
  const score = nodeScores[nodeId] ?? 0;
  if (score > 20) return { borderWidth: '2px', borderColor: '#C03020' };
  if (score > 5) return { borderWidth: '2px', borderColor: '#E07820' };
  if (score > 0) return { borderWidth: '2px', borderColor: '#F0C040' };
  return undefined;
}

function CareerNodeCardInner({ data }: NodeProps<CareerNodeNode>) {
  const {
    label,
    node,
    depth,
    hasChildren,
    isCollapsed,
    orientation,
    onNodeClick,
    toggleNode,
    selectedNodeId,
    nodeScores,
    compact,
  } = data;

  const [hovered, setHovered] = useState(false);

  const isRoot = depth === 0;
  const isTerminal = !hasChildren && !isRoot;
  const isSelected = selectedNodeId === node.id;

  const heatmapActive = useMemo(
    () => Boolean(!isRoot && heatmapBorderStyles(node.id, nodeScores)),
    [isRoot, node.id, nodeScores]
  );

  const handleClick = () => {
    onNodeClick(node);
    if (hasChildren) toggleNode(node.id);
  };

  const targetPos = orientation === 'horizontal' ? Position.Left : Position.Top;
  const sourcePos = orientation === 'horizontal' ? Position.Right : Position.Bottom;

  const cardStyle: CSSProperties = useMemo(() => {
    const hm = !isRoot ? heatmapBorderStyles(node.id, nodeScores) : undefined;
    const borderWidth = hm ? hm.borderWidth : '1.5px';
    let borderColor: string;
    if (isSelected) {
      borderColor = '#2D6A4F';
    } else if (hm) {
      borderColor = hm.borderColor;
    } else if (hovered && !isRoot) {
      borderColor = '#2D6A4F';
    } else if (isRoot) {
      borderColor = '#1A1A18';
    } else if (isTerminal) {
      borderColor = '#E0DDD8';
    } else {
      borderColor = '#E8E4DC';
    }

    let background: string;
    if (isSelected && !isRoot) {
      background = '#F4FAF7';
    } else if (isRoot) {
      background = '#1A1A18';
    } else if (isTerminal) {
      background = '#F7F5F0';
    } else {
      background = '#FFFFFF';
    }

    let boxShadow: string;
    if (isSelected) {
      boxShadow = '0 2px 16px rgba(45,106,79,0.18)';
    } else if (hovered && !isRoot && !hm) {
      boxShadow = '0 2px 12px rgba(45,106,79,0.12)';
    } else {
      boxShadow = '0 1px 4px rgba(0,0,0,0.06), 0 0 0 0 transparent';
    }

    const style: CSSProperties = {
      background,
      borderWidth,
      borderStyle: 'solid',
      borderColor,
      borderRadius: compact ? 12 : 14,
      padding: compact ? '10px 12px' : '12px 16px',
      minWidth: compact ? 160 : 180,
      maxWidth: compact ? 200 : 220,
      width: 'fit-content',
      boxShadow,
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
      cursor: 'pointer',
      userSelect: 'none',
    };

    if (isRoot) {
      style.color = '#F7F5F0';
      style.fontFamily = 'var(--font-serif)';
      style.fontSize = compact ? 14 : 15;
    }

    return style;
  }, [compact, hovered, isRoot, isSelected, isTerminal, node.id, nodeScores]);

  return (
    <>
      <Handle
        type="target"
        position={targetPos}
        id={orientation === 'horizontal' ? 'left' : 'top'}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        style={cardStyle}
        onMouseEnter={() => {
          if (isRoot || heatmapActive) return;
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
      >
        {isTerminal ? (
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: compact ? 12 : 13,
                fontWeight: 500,
                color: '#1A1A18',
                lineHeight: 1.4,
              }}
            >
              {label}
            </div>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#2D6A4F',
                flexShrink: 0,
                marginTop: 5,
              }}
            />
          </div>
        ) : (
          <>
            <div
              style={{
                fontFamily: isRoot ? 'var(--font-serif)' : 'var(--font-sans)',
                fontSize: isRoot ? (compact ? 14 : 15) : compact ? 12 : 13,
                fontWeight: isRoot ? 400 : 500,
                color: isRoot ? '#F7F5F0' : '#1A1A18',
                lineHeight: 1.4,
              }}
            >
              {label}
            </div>

            {hasChildren && !isRoot && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginTop: 8,
                  minHeight: 14,
                }}
              >
                <ChevronRight
                  size={14}
                  color="#6B6860"
                  style={{
                    transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                    transition: 'transform 200ms ease',
                  }}
                />
              </div>
            )}
          </>
        )}
      </motion.div>
      <Handle
        type="source"
        position={sourcePos}
        id={orientation === 'horizontal' ? 'right' : 'bottom'}
        style={{ opacity: 0, pointerEvents: 'none' }}
      />
    </>
  );
}

export const CareerNodeCard = memo(function CareerNodeCard(props: NodeProps<CareerNodeNode>) {
  return <CareerNodeCardInner {...props} />;
});
