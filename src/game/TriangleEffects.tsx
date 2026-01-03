import React from 'react';
import { Triangle, Bubble, CONFIG } from './types';
import { getTriangleCenter } from './hexGrid';

interface TriangleEffectsProps {
  triangles: Triangle[];
  bubbles: Bubble[];
  offsetX: number;
  offsetY: number;
}

export const TriangleEffects: React.FC<TriangleEffectsProps> = ({
  triangles,
  bubbles,
  offsetX,
  offsetY,
}) => {
  return (
    <g>
      {triangles.map(triangle => {
        const [id1, id2, id3] = triangle.bubbleIds;
        const b1 = bubbles.find(b => b.id === id1)!;
        const b2 = bubbles.find(b => b.id === id2)!;
        const b3 = bubbles.find(b => b.id === id3)!;
        
        // Calculate screen positions
        const x1 = b1.x + offsetX;
        const y1 = b1.y + offsetY;
        const x2 = b2.x + offsetX;
        const y2 = b2.y + offsetY;
        const x3 = b3.x + offsetX;
        const y3 = b3.y + offsetY;
        
        const center = getTriangleCenter(triangle, bubbles);
        const centerX = center.x + offsetX;
        const centerY = center.y + offsetY;
        
        // Progress indicator (when triangle is progressing toward activation)
        const progressOpacity = triangle.isProgressing 
          ? (triangle.activationTimer / CONFIG.TRIANGLE_ACTIVATION_TIME) * 0.4
          : 0;
        
        // Activation flash
        const activationOpacity = triangle.justActivated
          ? (triangle.activationFadeTimer / CONFIG.ACTIVATION_FADE_DURATION) * 0.7
          : 0;
        
        if (progressOpacity <= 0 && activationOpacity <= 0) {
          return null;
        }
        
        return (
          <g key={triangle.id}>
            {/* Progress fill */}
            {progressOpacity > 0 && (
              <polygon
                points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                fill={`hsla(45, 70%, 60%, ${progressOpacity})`}
                style={{
                  filter: 'blur(4px)',
                }}
              />
            )}
            
            {/* Activation flash */}
            {activationOpacity > 0 && (
              <>
                <polygon
                  points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
                  fill={`hsla(180, 60%, 70%, ${activationOpacity})`}
                  style={{
                    filter: 'blur(8px)',
                  }}
                />
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={30 + (1 - triangle.activationFadeTimer / CONFIG.ACTIVATION_FADE_DURATION) * 40}
                  fill="none"
                  stroke={`hsla(180, 70%, 80%, ${activationOpacity * 0.6})`}
                  strokeWidth={2}
                  style={{
                    filter: 'blur(3px)',
                  }}
                />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
};
