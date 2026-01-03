import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Bubble, Triangle, CONFIG } from './types';
import { generateHexGrid, findAllTriangles } from './hexGrid';

function createInitialState(): GameState {
  const bubbles = generateHexGrid(CONFIG.GRID_RINGS);
  const triangles = findAllTriangles(bubbles);
  
  return {
    bubbles,
    triangles,
    isComplete: false,
    completionTime: 0,
  };
}

export function useGameLoop() {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  
  // Handle bubble tap
  const handleBubbleTap = useCallback((bubbleId: number) => {
    setGameState(prev => {
      const bubbles = prev.bubbles.map(bubble => {
        if (bubble.id === bubbleId && !bubble.isCentral) {
          return {
            ...bubble,
            support: true,
            supportTimer: CONFIG.SUPPORT_DURATION,
          };
        }
        return bubble;
      });
      
      return { ...prev, bubbles };
    });
  }, []);
  
  // Reset game
  const resetGame = useCallback(() => {
    setGameState(createInitialState());
  }, []);
  
  // Main game loop
  useEffect(() => {
    const update = (currentTime: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;
      
      setGameState(prev => {
        if (prev.isComplete) {
          const bubbles = prev.bubbles.map(bubble => ({
            ...bubble,
            pulsePhase: (bubble.pulsePhase + CONFIG.PULSE_SPEED_MIN * deltaTime) % 1,
          }));
          return { ...prev, bubbles, completionTime: prev.completionTime + deltaTime };
        }
        
        // Update bubbles
        let bubbles = prev.bubbles.map(bubble => {
          const newBubble = { ...bubble };
          
          // Update pulse phase based on state
          const pulseSpeed = CONFIG.PULSE_SPEED_MIN + 
            (bubble.state - 1) / 7 * (CONFIG.PULSE_SPEED_MAX - CONFIG.PULSE_SPEED_MIN);
          newBubble.pulsePhase = (bubble.pulsePhase + pulseSpeed * deltaTime) % 1;
          
          // Update support timer
          if (bubble.support) {
            newBubble.supportTimer = Math.max(0, bubble.supportTimer - deltaTime);
            if (newBubble.supportTimer <= 0) {
              newBubble.support = false;
            }
          }
          
          // Apply drift (only if not supported and not central)
          if (!bubble.isCentral && !bubble.support) {
            newBubble.stateFloat = Math.min(
              CONFIG.STATE_MAX,
              bubble.stateFloat + CONFIG.DRIFT_RATE * deltaTime
            );
            newBubble.state = Math.min(CONFIG.STATE_MAX, Math.floor(newBubble.stateFloat));
          }
          
          return newBubble;
        });
        
        // Update triangles
        let triangles = prev.triangles.map(triangle => {
          const newTriangle = { ...triangle };
          
          // Update activation fade
          if (triangle.justActivated) {
            newTriangle.activationFadeTimer = Math.max(0, triangle.activationFadeTimer - deltaTime);
            if (newTriangle.activationFadeTimer <= 0) {
              newTriangle.justActivated = false;
            }
          }
          
          // Get the three bubbles
          const [id1, id2, id3] = triangle.bubbleIds;
          const b1 = bubbles.find(b => b.id === id1)!;
          const b2 = bubbles.find(b => b.id === id2)!;
          const b3 = bubbles.find(b => b.id === id3)!;
          
          // Check activation conditions
          const sameState = b1.state === b2.state && b2.state === b3.state;
          const stateAboveMin = b1.state > CONFIG.STATE_MIN;
          const hasSupport = b1.support || b2.support || b3.support;
          
          const conditionsMet = sameState && stateAboveMin && hasSupport;
          
          if (conditionsMet) {
            newTriangle.isProgressing = true;
            newTriangle.activationTimer += deltaTime;
            
            if (newTriangle.activationTimer >= CONFIG.TRIANGLE_ACTIVATION_TIME) {
              const newState = b1.state - 1;
              
              bubbles = bubbles.map(bubble => {
                if (bubble.id === id1 || bubble.id === id2 || bubble.id === id3) {
                  return {
                    ...bubble,
                    state: newState,
                    stateFloat: newState,
                    support: false,
                    supportTimer: 0,
                  };
                }
                return bubble;
              });
              
              newTriangle.activationTimer = 0;
              newTriangle.isProgressing = false;
              newTriangle.justActivated = true;
              newTriangle.activationFadeTimer = CONFIG.ACTIVATION_FADE_DURATION;
            }
          } else {
            newTriangle.activationTimer = 0;
            newTriangle.isProgressing = false;
          }
          
          return newTriangle;
        });
        
        const isComplete = bubbles.every(b => b.state === CONFIG.STATE_MIN);
        
        return {
          bubbles,
          triangles,
          isComplete,
          completionTime: isComplete && !prev.isComplete ? 0 : prev.completionTime,
        };
      });
      
      animationFrameRef.current = requestAnimationFrame(update);
    };
    
    animationFrameRef.current = requestAnimationFrame(update);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return {
    gameState,
    handleBubbleTap,
    resetGame,
  };
}
