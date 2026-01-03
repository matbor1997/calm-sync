import React, { useEffect, useState, useCallback } from 'react';
import { useGameLoop } from './useGameLoop';
import { GameNodeComponent } from './GameNode';
import { ConnectionLines } from './ConnectionLines';
import { ArrivalScreen } from './ArrivalScreen';
import { ReflectionScreen } from './ReflectionScreen';

export const GameCanvas: React.FC = () => {
  const { gameState, handleNodeTap, startExperience, returnToArrival } = useGameLoop();
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
  
  // Background breathing effect
  const breathValue = Math.sin(gameState.globalBreathPhase * Math.PI * 2);
  const bgBrightness = 8 + breathValue * 2;
  
  // Transition overlay opacity
  const transitionOpacity = gameState.isTransitioning ? gameState.transitionProgress : 0;
  
  if (dimensions.width === 0) {
    return <div className="h-full w-full bg-background" />;
  }
  
  // Render based on current view
  if (gameState.currentView === 'arrival') {
    return (
      <ArrivalScreen 
        globalBreathPhase={gameState.globalBreathPhase}
        onEnter={startExperience}
      />
    );
  }
  
  if (gameState.currentView === 'reflection') {
    return (
      <ReflectionScreen 
        globalBreathPhase={gameState.globalBreathPhase}
        onRest={returnToArrival}
      />
    );
  }
  
  // Experience view
  return (
    <div 
      className="h-full w-full relative overflow-hidden"
      onTouchStart={handleTouchStart}
      style={{ touchAction: 'none' }}
    >
      {/* Breathing background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            hsl(220, 55%, ${bgBrightness}%) 0%,
            hsl(245, 42%, ${bgBrightness + 4}%) 50%,
            hsl(270, 35%, ${bgBrightness + 2}%) 100%
          )`,
          transform: `scale(${1 + breathValue * 0.015})`,
          transition: 'transform 0.5s ease-out',
        }}
      />
      
      {/* Soft vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 35%, hsla(220, 60%, 4%, ${0.35 + breathValue * 0.08}) 100%)`,
        }}
      />
      
      {/* Configuration transition overlay */}
      {gameState.isTransitioning && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, hsla(200, 30%, 80%, 0.2) 0%, transparent 60%)',
            opacity: Math.sin(transitionOpacity * Math.PI),
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
        {/* Connection lines between nodes */}
        <ConnectionLines 
          nodes={gameState.nodes}
          screenWidth={dimensions.width}
          screenHeight={dimensions.height}
        />
        
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
    </div>
  );
};
