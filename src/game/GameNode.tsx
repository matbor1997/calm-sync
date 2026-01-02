import React, { useMemo } from 'react';
import { GameNode as GameNodeType, GAME_CONFIG, isNodeActive } from './types';

interface GameNodeProps {
  node: GameNodeType;
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
  // Calculate pixel position and size
  const pixelX = node.x * screenWidth;
  const pixelY = node.y * screenHeight;
  
  // Responsive radius with min/max bounds
  const baseRadius = Math.min(
    Math.max(screenWidth * GAME_CONFIG.NODE_RADIUS_BASE, GAME_CONFIG.NODE_RADIUS_MIN),
    GAME_CONFIG.NODE_RADIUS_MAX
  );
  
  // Calculate visual states
  const isActive = !node.locked && isNodeActive(node);
  const pulseScale = node.locked 
    ? 1 
    : 1 + Math.sin(node.phase * Math.PI * 2) * 0.08;
  
  // Smooth lock animation
  const lockEase = node.locked 
    ? 1 - Math.pow(1 - node.lockAnimationProgress, 3) 
    : 0;
  
  // Colors - transition between states
  const nodeColor = useMemo(() => {
    if (node.locked) {
      return `hsl(200, ${30 + lockEase * 10}%, ${75 + lockEase * 10}%)`;
    }
    if (isActive) {
      // Golden glow when tappable
      return `hsl(45, 90%, 65%)`;
    }
    // Base teal color
    return `hsl(180, 45%, 55%)`;
  }, [node.locked, isActive, lockEase]);
  
  // Glow intensity
  const glowIntensity = useMemo(() => {
    if (node.locked) return 0.5;
    if (isActive) return 1;
    return 0.3;
  }, [node.locked, isActive]);
  
  // Touch target (larger than visual)
  const touchRadius = baseRadius * GAME_CONFIG.TOUCH_TARGET_MULTIPLIER;
  
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTap(node.id);
  };
  
  return (
    <g 
      transform={`translate(${pixelX}, ${pixelY})`}
      onPointerDown={handlePointerDown}
      style={{ cursor: node.locked ? 'default' : 'pointer' }}
    >
      {/* Invisible touch target */}
      <circle
        r={touchRadius}
        fill="transparent"
        style={{ touchAction: 'none' }}
      />
      
      {/* Outer glow */}
      <circle
        r={baseRadius * pulseScale * 1.4}
        fill={`url(#glow-gradient-${node.id})`}
        opacity={glowIntensity * 0.6}
        style={{
          transition: node.locked ? 'opacity 0.5s ease-out' : 'opacity 0.15s ease-out',
        }}
      />
      
      {/* Lock ripple effect */}
      {node.rippleActive && (
        <circle
          r={baseRadius * (1 + node.rippleProgress * 1.5)}
          fill="none"
          stroke="hsl(200, 30%, 85%)"
          strokeWidth={2}
          opacity={0.6 * (1 - node.rippleProgress)}
        />
      )}
      
      {/* Main node body */}
      <circle
        r={baseRadius * pulseScale}
        fill={nodeColor}
        style={{
          transition: 'fill 0.2s ease-out',
          filter: node.locked 
            ? 'drop-shadow(0 0 15px hsla(200, 30%, 85%, 0.5))'
            : isActive 
              ? 'drop-shadow(0 0 20px hsla(45, 90%, 65%, 0.8))'
              : 'drop-shadow(0 0 8px hsla(180, 45%, 55%, 0.3))',
        }}
      />
      
      {/* Inner highlight */}
      <circle
        r={baseRadius * pulseScale * 0.6}
        fill={`url(#inner-highlight-${node.id})`}
        opacity={0.4}
      />
      
      {/* Phase indicator ring (subtle) */}
      {!node.locked && (
        <circle
          r={baseRadius * pulseScale * 0.85}
          fill="none"
          stroke="hsla(0, 0%, 100%, 0.2)"
          strokeWidth={2}
          strokeDasharray={`${node.phase * baseRadius * 5.3} ${baseRadius * 5.3}`}
          transform="rotate(-90)"
          style={{
            transition: 'stroke-dasharray 0.05s linear',
          }}
        />
      )}
      
      {/* Locked center dot */}
      {node.locked && lockEase > 0.5 && (
        <circle
          r={baseRadius * 0.15 * lockEase}
          fill="hsla(0, 0%, 100%, 0.8)"
        />
      )}
      
      {/* Gradient definitions for this node */}
      <defs>
        <radialGradient id={`glow-gradient-${node.id}`}>
          <stop 
            offset="0%" 
            stopColor={isActive && !node.locked ? 'hsl(45, 90%, 65%)' : nodeColor} 
            stopOpacity="0.8" 
          />
          <stop offset="100%" stopColor={nodeColor} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`inner-highlight-${node.id}`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="white" stopOpacity="0.6" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
    </g>
  );
};
