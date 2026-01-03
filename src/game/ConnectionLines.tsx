import React from 'react';
import { Bubble, CONFIG } from './types';

interface ConnectionLinesProps {
  bubbles: Bubble[];
  offsetX: number;
  offsetY: number;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  bubbles,
  offsetX,
  offsetY,
}) => {
  const lines: React.ReactNode[] = [];
  const drawnPairs = new Set<string>();
  
  bubbles.forEach(bubble => {
    bubble.neighbors.forEach(neighborId => {
      const key = [bubble.id, neighborId].sort((a, b) => a - b).join('-');
      if (drawnPairs.has(key)) return;
      drawnPairs.add(key);
      
      const neighbor = bubbles.find(b => b.id === neighborId);
      if (!neighbor) return;
      
      const x1 = bubble.x + offsetX;
      const y1 = bubble.y + offsetY;
      const x2 = neighbor.x + offsetX;
      const y2 = neighbor.y + offsetY;
      
      const avgState = (bubble.state + neighbor.state) / 2;
      const calmness = 1 - (avgState - 1) / 7;
      const opacity = 0.08 + calmness * 0.12;
      
      const avgPulse = (bubble.pulsePhase + neighbor.pulsePhase) / 2;
      const pulseValue = Math.sin(avgPulse * Math.PI * 2) * 0.5 + 0.5;
      
      lines.push(
        <line
          key={key}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={`hsla(200, 30%, 60%, ${opacity + pulseValue * 0.05})`}
          strokeWidth={1 + calmness * 0.5}
          strokeLinecap="round"
        />
      );
    });
  });
  
  return <g>{lines}</g>;
};
