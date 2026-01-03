import React from 'react';
import { BreathingNode } from './types';

interface ConnectionLinesProps {
  nodes: BreathingNode[];
  screenWidth: number;
  screenHeight: number;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  nodes,
  screenWidth,
  screenHeight,
}) => {
  // Create unique connection pairs
  const connections: { from: BreathingNode; to: BreathingNode }[] = [];
  const seen = new Set<string>();
  
  nodes.forEach(node => {
    node.connections.forEach(connId => {
      const key = [Math.min(node.id, connId), Math.max(node.id, connId)].join('-');
      if (!seen.has(key)) {
        seen.add(key);
        const connNode = nodes.find(n => n.id === connId);
        if (connNode) {
          connections.push({ from: node, to: connNode });
        }
      }
    });
  });
  
  return (
    <g>
      {connections.map(({ from, to }) => {
        const x1 = from.x * screenWidth;
        const y1 = from.y * screenHeight;
        const x2 = to.x * screenWidth;
        const y2 = to.y * screenHeight;
        
        // Interpolate breath phase for line pulse
        const avgPhase = (from.phase + to.phase) / 2;
        const pulseValue = Math.sin(avgPhase * Math.PI * 2);
        
        // Opacity based on tuning states
        const bothSettled = from.tuningState === 'settled' && to.tuningState === 'settled';
        const eitherSettled = from.tuningState === 'settled' || to.tuningState === 'settled';
        
        let baseOpacity = 0.08;
        if (bothSettled) baseOpacity = 0.25;
        else if (eitherSettled) baseOpacity = 0.15;
        
        const opacity = baseOpacity + pulseValue * 0.05;
        
        // Color
        const hue = bothSettled ? 200 : 190;
        const sat = bothSettled ? 30 : 25;
        const light = bothSettled ? 65 : 50;
        
        return (
          <line
            key={`${from.id}-${to.id}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={`hsl(${hue}, ${sat}%, ${light}%)`}
            strokeWidth={bothSettled ? 1.5 : 1}
            opacity={opacity}
            strokeLinecap="round"
            style={{
              transition: 'stroke 0.5s ease-out, stroke-width 0.5s ease-out',
            }}
          />
        );
      })}
    </g>
  );
};
