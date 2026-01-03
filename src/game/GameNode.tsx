import React, { useMemo } from 'react';
import { BreathingNode, CONFIG } from './types';

interface GameNodeProps {
  node: BreathingNode;
  screenWidth: number;
  screenHeight: number;
  onTap: (id: number) => void;
}

export const GameNodeComponent: React.FC<GameNodeProps> = ({
  node,
  screenWidth,
  screenHeight,
  onTap,
}) => {
  // Calculate pixel position
  const pixelX = node.x * screenWidth;
  const pixelY = node.y * screenHeight;
  
  // Responsive radius
  const baseRadius = Math.min(
    Math.max(screenWidth * CONFIG.NODE_RADIUS_BASE, CONFIG.NODE_RADIUS_MIN),
    CONFIG.NODE_RADIUS_MAX
  );
  
  const radius = node.isAnchor ? baseRadius * CONFIG.ANCHOR_RADIUS_MULTIPLIER : baseRadius;
  
  // Breathing effect - sinusoidal brightness and scale
  // Phase 0 = peak (inhale complete), 0.5 = trough (exhale complete)
  const breathValue = Math.sin(node.phase * Math.PI * 2);
  const breathScale = 1 + breathValue * 0.06;
  
  // Brightness based on breath phase and tuning state
  const baseBrightness = useMemo(() => {
    if (node.isAnchor) return 0.85;
    switch (node.tuningState) {
      case 'settled': return 0.8;
      case 'synchronizing': return 0.65;
      case 'listening': return 0.55;
      default: return 0.45;
    }
  }, [node.isAnchor, node.tuningState]);
  
  const breathBrightness = baseBrightness + breathValue * 0.15;
  
  // Visual noise (slight position jitter for untuned nodes)
  const noiseX = node.visualNoise * Math.sin(node.phase * 7) * 3;
  const noiseY = node.visualNoise * Math.cos(node.phase * 5) * 3;
  
  // Colors based on tuning state
  const nodeColor = useMemo(() => {
    const lightness = Math.round(breathBrightness * 100);
    if (node.isAnchor) {
      return `hsl(200, 25%, ${lightness}%)`;
    }
    switch (node.tuningState) {
      case 'settled':
        return `hsl(195, 28%, ${lightness}%)`;
      case 'synchronizing':
        return `hsl(190, 32%, ${lightness}%)`;
      case 'listening':
        return `hsl(185, 35%, ${lightness}%)`;
      default:
        return `hsl(180, 40%, ${lightness - 10}%)`;
    }
  }, [node.isAnchor, node.tuningState, breathBrightness]);
  
  // Glow opacity
  const glowOpacity = useMemo(() => {
    if (node.isAnchor) return 0.5 + breathValue * 0.2;
    switch (node.tuningState) {
      case 'settled': return 0.45 + breathValue * 0.15;
      case 'synchronizing': return 0.3 + breathValue * 0.1;
      case 'listening': return 0.2 + breathValue * 0.08;
      default: return 0.1;
    }
  }, [node.isAnchor, node.tuningState, breathValue]);
  
  const touchRadius = radius * CONFIG.TOUCH_TARGET_MULTIPLIER;
  
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!node.isAnchor && node.tuningState !== 'settled') {
      onTap(node.id);
    }
  };
  
  return (
    <g 
      transform={`translate(${pixelX + noiseX}, ${pixelY + noiseY})`}
      onPointerDown={handlePointerDown}
      style={{ cursor: node.isAnchor || node.tuningState === 'settled' ? 'default' : 'pointer' }}
    >
      {/* Invisible touch target */}
      <circle
        r={touchRadius}
        fill="transparent"
        style={{ touchAction: 'none' }}
      />
      
      {/* Outer breathing glow */}
      <circle
        r={radius * breathScale * 1.6}
        fill={`url(#breath-glow-${node.id})`}
        opacity={glowOpacity}
      />
      
      {/* Tap ripple effect */}
      {node.tapRippleProgress > 0 && node.tapRippleProgress < 1 && (
        <circle
          r={radius * (1 + node.tapRippleProgress * 0.8)}
          fill="none"
          stroke="hsl(200, 30%, 75%)"
          strokeWidth={2}
          opacity={0.5 * (1 - node.tapRippleProgress)}
        />
      )}
      
      {/* Main node body */}
      <circle
        r={radius * breathScale}
        fill={nodeColor}
        style={{
          transition: 'fill 0.3s ease-out',
        }}
      />
      
      {/* Inner soft highlight */}
      <circle
        r={radius * breathScale * 0.55}
        fill={`url(#inner-glow-${node.id})`}
        opacity={0.4 + breathValue * 0.1}
      />
      
      {/* Anchor indicator - steady inner dot */}
      {node.isAnchor && (
        <circle
          r={radius * 0.12}
          fill="hsla(200, 20%, 95%, 0.7)"
        />
      )}
      
      {/* Gradient definitions */}
      <defs>
        <radialGradient id={`breath-glow-${node.id}`}>
          <stop offset="0%" stopColor={nodeColor} stopOpacity="0.6" />
          <stop offset="100%" stopColor={nodeColor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`inner-glow-${node.id}`} cx="35%" cy="35%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  );
};
