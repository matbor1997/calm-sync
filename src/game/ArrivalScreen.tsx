import React, { useEffect, useState } from 'react';
import { CONFIG } from './types';

interface ArrivalScreenProps {
  globalBreathPhase: number;
  onEnter: () => void;
}

export const ArrivalScreen: React.FC<ArrivalScreenProps> = ({
  globalBreathPhase,
  onEnter,
}) => {
  const [showText, setShowText] = useState(false);
  const [textFading, setTextFading] = useState(false);
  
  // Fade in text after delay
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setShowText(true);
    }, CONFIG.ARRIVAL_FADE_DELAY);
    
    const fadeTimer = setTimeout(() => {
      setTextFading(true);
    }, CONFIG.ARRIVAL_FADE_DELAY + CONFIG.ARRIVAL_FADE_DURATION);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
    };
  }, []);
  
  // Breathing background effect
  const breathValue = Math.sin(globalBreathPhase * Math.PI * 2);
  const bgBrightness = 8 + breathValue * 2;
  
  const handleTap = () => {
    onEnter();
  };
  
  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
      onClick={handleTap}
      onTouchEnd={handleTap}
      style={{ touchAction: 'none' }}
    >
      {/* Breathing background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            hsl(220, 55%, ${bgBrightness}%) 0%,
            hsl(240, 40%, ${bgBrightness + 3}%) 50%,
            hsl(260, 35%, ${bgBrightness + 1}%) 100%
          )`,
          transition: 'background 0.5s ease-out',
        }}
      />
      
      {/* Subtle vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, hsla(220, 60%, 3%, 0.4) 100%)',
        }}
      />
      
      {/* Message text */}
      <div 
        className="relative z-10 px-8 text-center"
        style={{
          opacity: showText ? (textFading ? 0.3 : 0.6) : 0,
          transform: `translateY(${showText ? 0 : 10}px)`,
          transition: 'opacity 2s ease-out, transform 2s ease-out',
        }}
      >
        <p className="text-foreground/50 text-lg font-light tracking-wide leading-relaxed">
          Nothing here demands your attention.
        </p>
      </div>
      
      {/* Enter affordance */}
      <div 
        className="absolute bottom-32 z-10"
        style={{
          opacity: 0.3 + breathValue * 0.15,
          transition: 'opacity 1s ease-out',
        }}
      >
        <span className="text-foreground/40 text-sm font-light tracking-[0.3em] uppercase">
          begin
        </span>
      </div>
    </div>
  );
};
