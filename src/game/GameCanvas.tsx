import React, { useEffect, useState, useCallback } from 'react';
import { useGameLoop } from './useGameLoop';
import { GameNodeComponent } from './GameNode';

export const GameCanvas: React.FC = () => {
  const { gameState, handleNodeTap, resetGame } = useGameLoop();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [breathPhase, setBreathPhase] = useState(0);
  
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
  
  // Background breathing animation
  useEffect(() => {
    let animationFrame: number;
    let startTime = performance.now();
    
    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startTime) / 1000;
      const breathDuration = 8; // seconds
      setBreathPhase((elapsed % breathDuration) / breathDuration);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);
  
  // Prevent default touch behaviors
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);
  
  // Calculate breath effect
  const breathValue = Math.sin(breathPhase * Math.PI * 2) * 0.5 + 0.5;
  const bgOpacity = 0.95 + breathValue * 0.05;
  
  // Completion state modifies breath
  const completionFactor = gameState.isComplete ? 1 : 0;
  
  if (dimensions.width === 0) {
    return <div className="h-full w-full game-background" />;
  }
  
  return (
    <div 
      className="h-full w-full relative overflow-hidden"
      onTouchStart={handleTouchStart}
      style={{ touchAction: 'none' }}
    >
      {/* Animated background */}
      <div 
        className="absolute inset-0 game-background"
        style={{
          opacity: bgOpacity,
          transform: `scale(${1 + breathValue * 0.02})`,
          transition: gameState.isComplete ? 'all 1s ease-out' : undefined,
        }}
      />
      
      {/* Vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, hsla(220, 60%, 5%, ${0.3 + breathValue * 0.1}) 100%)`,
        }}
      />
      
      {/* Completion glow overlay */}
      {gameState.isComplete && (
        <div 
          className="absolute inset-0 pointer-events-none completion-glow"
          style={{
            background: 'radial-gradient(ellipse at center, hsla(200, 30%, 85%, 0.3) 0%, transparent 70%)',
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
        {/* Subtle connection lines between nodes (optional visual) */}
        <g opacity={0.1}>
          {gameState.nodes.map((node, i) => 
            gameState.nodes.slice(i + 1).map((otherNode) => {
              const x1 = node.x * dimensions.width;
              const y1 = node.y * dimensions.height;
              const x2 = otherNode.x * dimensions.width;
              const y2 = otherNode.y * dimensions.height;
              const bothLocked = node.locked && otherNode.locked;
              
              return (
                <line
                  key={`${node.id}-${otherNode.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={bothLocked ? 'hsl(200, 30%, 70%)' : 'hsl(180, 30%, 40%)'}
                  strokeWidth={bothLocked ? 2 : 1}
                  opacity={bothLocked ? 0.4 : 0.15}
                  style={{
                    transition: 'all 0.5s ease-out',
                  }}
                />
              );
            })
          )}
        </g>
        
        {/* Render nodes */}
        {gameState.nodes.map(node => (
          <GameNodeComponent
            key={node.id}
            node={node}
            screenWidth={dimensions.width}
            screenHeight={dimensions.height}
            onTap={handleNodeTap}
          />
        ))}
      </svg>
      
      {/* Initial hint text */}
      {gameState.showHint && (
        <div 
          className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none fade-in-hint"
        >
          <p className="text-muted-foreground/60 text-sm font-light tracking-wide">
            tap when glowing
          </p>
        </div>
      )}
      
      {/* Minimal restart affordance after completion */}
      {gameState.isComplete && (
        <div 
          className="absolute inset-x-0 bottom-20 flex justify-center"
          style={{
            animation: 'fadeInHint 2s ease-in-out forwards',
            animationDelay: '0.5s',
            opacity: 0,
          }}
        >
          <button
            onClick={resetGame}
            className="text-muted-foreground/40 text-xs font-light tracking-widest uppercase hover:text-muted-foreground/60 transition-colors duration-500 px-6 py-3"
          >
            again
          </button>
        </div>
      )}
    </div>
  );
};
