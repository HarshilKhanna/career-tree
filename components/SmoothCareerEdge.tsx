'use client';

import { getBezierPath, type EdgeProps } from '@xyflow/react';
import { motion } from 'framer-motion';

const PATH_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export function SmoothCareerEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.4,
  });

  return (
    <motion.path
      className="react-flow__edge-path"
      initial={false}
      animate={{ d: edgePath }}
      transition={{ duration: 0.45, ease: PATH_EASE }}
      fill="none"
      stroke="#C8C4BC"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  );
}
