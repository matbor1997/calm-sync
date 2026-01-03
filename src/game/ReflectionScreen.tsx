import React, { useEffect, useState } from 'react';
import { CONFIG } from './types';

interface ReflectionScreenProps {
  globalBreathPhase: number;
  onRest: () => void;
}

export const ReflectionScreen: React.FC<ReflectionScreenProps> = ({
  globalBreathPhase,
  onRest,
}) => {
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, CONFIG.REFLECTION_DELAY);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Very slow, calm breathing
  const breathValue = Math.sin(globalBreathPhase * Math.PI * 2);
  const bgBrightness = 10 + breathValue * 1;
  
  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ touchAction: 'none' }}
    >
      {/* Very still background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            hsl(220, 45%, ${bgBrightness}%) 0%,
            hsl(230, 35%, ${bgBrightness + 2}%) 50%,
            hsl(240, 30%, ${bgBrightness}%) 100%
          )`,
          transition: 'background 2s ease-out',
        }}
      />
      
      {/* Soft center glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, 
            hsla(200, 30%, 70%, ${0.05 + breathValue * 0.02}) 0%, 
            transparent 50%
          )`,
        }}
      />
      
      {/* Content */}
      <div 
        className="relative z-10 flex flex-col items-center gap-16"
        style={{
          opacity: showContent ? 1 : 0,
          transform: `translateY(${showContent ? 0 : 10}px)`,
          transition: 'opacity 3s ease-out, transform 3s ease-out',
        }}
      >
        {/* Optional subtle message */}
        <p 
          className="text-foreground/30 text-base font-light tracking-wide"
          style={{
            opacity: 0.5 + breathValue * 0.1,
          }}
        >
          You can stop here.
        </p>
        
        {/* Rest button */}
        <button
          onClick={onRest}
          className="text-foreground/25 text-sm font-light tracking-[0.25em] uppercase 
                     hover:text-foreground/40 transition-colors duration-1000
                     px-8 py-4"
        >
          rest
        </button>
      </div>
    </div>
  );
};
