import React, { useEffect, useState, useCallback } from 'react';
import { useGameLoop } from './useGameLoop';
import { BubbleComponent } from './Bubble';
import { ConnectionLines } from './ConnectionLines';
import { TriangleEffects } from './TriangleEffects';
import { CONFIG } from './types';

export const GameCanvas: React.FC = () => {
  const { gameState, handleBubbleTap, resetGame } = useGameLoop();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Prevent default touch behaviors
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);
  
  // Calculate center offset to position grid in middle of screen
  const offsetX = dimensions.width / 2;
  const offsetY = dimensions.height / 2;
  
  // Background color based on overall system state
  const avgState = gameState.bubbles.reduce((sum, b) => sum + b.state, 0) / gameState.bubbles.length;
  const systemCalmness = 1 - (avgState - 1) / 7;
  
  // Completion state affects visuals
  const completionProgress = gameState.isComplete 
    ? Math.min(1, gameState.completionTime / 2) 
    : 0;
  
  if (dimensions.width === 0) {
    return <div className="h-full w-full bg-background" />;
  }
  
  return (
    <div 
      className="h-full w-full relative overflow-hidden"
      onTouchStart={handleTouchStart}
      style={{ touchAction: 'none' }}
    >
      {/* Background gradient - becomes calmer as system stabilizes */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            hsl(220, ${35 - systemCalmness * 15}%, ${10 + systemCalmness * 4 + completionProgress * 3}%) 0%,
            hsl(240, ${30 - systemCalmness * 10}%, ${8 + systemCalmness * 3 + completionProgress * 2}%) 50%,
            hsl(260, ${25 - systemCalmness * 10}%, ${10 + systemCalmness * 4 + completionProgress * 3}%) 100%
          )`,
          transition: 'background 1s ease-out',
        }}
      />
      
      {/* Soft vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 30%, hsla(220, 50%, 5%, ${0.4 - systemCalmness * 0.15}) 100%)`,
        }}
      />
      
      {/* Completion glow */}
      {gameState.isComplete && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, hsla(180, 40%, 60%, 0.15) 0%, transparent 60%)',
            opacity: completionProgress,
          }}
        />
      )}
      
      {/* Game SVG canvas */}
      <svg 
        width={dimensions.width} 
        height={dimensions.height}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      >
        {/* Connection lines */}
        <ConnectionLines 
          bubbles={gameState.bubbles}
          offsetX={offsetX}
          offsetY={offsetY}
        />
        
        {/* Triangle activation effects */}
        <TriangleEffects
          triangles={gameState.triangles}
          bubbles={gameState.bubbles}
          offsetX={offsetX}
          offsetY={offsetY}
        />
        
        {/* Bubbles */}
        {gameState.bubbles.map(bubble => (
          <BubbleComponent
            key={bubble.id}
            bubble={bubble}
            offsetX={offsetX}
            offsetY={offsetY}
            onTap={handleBubbleTap}
          />
        ))}
      </svg>
      
      {/* Minimal reset affordance after completion */}
      {gameState.isComplete && completionProgress > 0.8 && (
        <div 
          className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-auto"
          style={{
            opacity: (completionProgress - 0.8) * 5,
          }}
        >
          <button
            onClick={resetGame}
            className="text-sm tracking-widest uppercase opacity-40 hover:opacity-70 transition-opacity duration-500"
            style={{
              color: 'hsl(180, 30%, 70%)',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 300,
              letterSpacing: '0.2em',
            }}
          >
            again
          </button>
        </div>
      )}
    </div>
  );
};
