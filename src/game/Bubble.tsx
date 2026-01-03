import React from 'react';
import { Bubble, CONFIG, getStateColor, getPulseSpeed } from './types';

interface BubbleComponentProps {
  bubble: Bubble;
  offsetX: number;
  offsetY: number;
  onTap: (id: number) => void;
}

export const BubbleComponent: React.FC<BubbleComponentProps> = ({
  bubble,
  offsetX,
  offsetY,
  onTap,
}) => {
  const screenX = bubble.x + offsetX;
  const screenY = bubble.y + offsetY;
  
  // Calculate pulse value (0-1) based on phase
  const pulseValue = Math.sin(bubble.pulsePhase * Math.PI * 2) * 0.5 + 0.5;
  
  // Get color based on state
  const color = bubble.isCentral 
    ? { h: 0, s: 0, l: 92 } // White for central
    : getStateColor(bubble.state);
  
  // Scale and glow based on pulse
  const baseRadius = bubble.isCentral ? CONFIG.BUBBLE_RADIUS * 1.15 : CONFIG.BUBBLE_RADIUS;
  const pulseScale = 1 + pulseValue * 0.12;
  const radius = baseRadius * pulseScale;
  
  // Brightness varies with pulse
  const brightness = color.l + pulseValue * 8;
  
  // Support indicator
  const supportGlow = bubble.support ? 0.6 : 0;
  const supportRingOpacity = bubble.support ? 0.8 : 0;
  
  // Touch target
  const touchRadius = CONFIG.BUBBLE_RADIUS * 1.4;
  
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTap(bubble.id);
  };
  
  return (
    <g>
      {/* Touch target (invisible) */}
      <circle
        cx={screenX}
        cy={screenY}
        r={touchRadius}
        fill="transparent"
        style={{ cursor: bubble.isCentral ? 'default' : 'pointer' }}
        onClick={handleClick}
        onTouchStart={handleClick}
      />
      
      {/* Support glow ring */}
      {bubble.support && (
        <circle
          cx={screenX}
          cy={screenY}
          r={radius + 8}
          fill="none"
          stroke={`hsla(45, 80%, 70%, ${supportRingOpacity})`}
          strokeWidth={3}
          style={{
            filter: 'blur(2px)',
          }}
        />
      )}
      
      {/* Outer glow */}
      <circle
        cx={screenX}
        cy={screenY}
        r={radius + 4}
        fill={`hsla(${color.h}, ${color.s}%, ${brightness}%, ${0.15 + pulseValue * 0.1 + supportGlow * 0.3})`}
        style={{
          filter: 'blur(8px)',
        }}
      />
      
      {/* Main bubble */}
      <circle
        cx={screenX}
        cy={screenY}
        r={radius}
        fill={`hsl(${color.h}, ${color.s}%, ${brightness}%)`}
        style={{
          filter: `drop-shadow(0 0 ${4 + pulseValue * 4}px hsla(${color.h}, ${color.s}%, ${brightness}%, 0.5))`,
          transition: 'fill 0.3s ease-out',
        }}
      />
      
      {/* Inner highlight */}
      <circle
        cx={screenX - radius * 0.25}
        cy={screenY - radius * 0.25}
        r={radius * 0.35}
        fill={`hsla(${color.h}, ${Math.max(0, color.s - 20)}%, ${Math.min(100, brightness + 20)}%, ${0.3 + pulseValue * 0.2})`}
      />
      
      {/* Central bubble marker */}
      {bubble.isCentral && (
        <circle
          cx={screenX}
          cy={screenY}
          r={radius * 0.3}
          fill={`hsla(0, 0%, 100%, ${0.4 + pulseValue * 0.2})`}
        />
      )}
    </g>
  );
};
