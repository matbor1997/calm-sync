import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  GameNode, 
  GameState, 
  GAME_CONFIG, 
  isNodeActive, 
  getNodeDistance 
} from './types';

// Generate initial node positions in a loose diamond pattern
function generateNodePositions(count: number): { x: number; y: number }[] {
  const { MARGIN_TOP, MARGIN_BOTTOM, MARGIN_HORIZONTAL } = GAME_CONFIG;
  const usableWidth = 1 - 2 * MARGIN_HORIZONTAL;
  const usableHeight = 1 - MARGIN_TOP - MARGIN_BOTTOM;
  
  // Diamond-ish pattern with slight asymmetry for natural feel
  const positions = [
    { x: 0.35, y: 0.28 },  // top-left
    { x: 0.68, y: 0.32 },  // top-right
    { x: 0.30, y: 0.68 },  // bottom-left
    { x: 0.65, y: 0.72 },  // bottom-right
    { x: 0.50, y: 0.50 },  // center (if 5 nodes)
  ];
  
  return positions.slice(0, count).map(p => ({
    x: MARGIN_HORIZONTAL + p.x * usableWidth,
    y: MARGIN_TOP + p.y * usableHeight,
  }));
}

// Create initial game state
function createInitialState(): GameState {
  const { NODE_COUNT, BASE_FREQUENCY_MIN, BASE_FREQUENCY_MAX } = GAME_CONFIG;
  const positions = generateNodePositions(NODE_COUNT);
  
  const nodes: GameNode[] = positions.map((pos, i) => {
    // Varied frequencies for each node
    const frequencyRange = BASE_FREQUENCY_MAX - BASE_FREQUENCY_MIN;
    const frequency = BASE_FREQUENCY_MIN + (i / (NODE_COUNT - 1)) * frequencyRange;
    // Stagger initial phases
    const phase = (i * 0.25) % 1;
    
    return {
      id: i,
      x: pos.x,
      y: pos.y,
      phase,
      frequency,
      targetFrequency: frequency,
      locked: false,
      lockAnimationProgress: 0,
      rippleActive: false,
      rippleProgress: 0,
    };
  });
  
  return {
    nodes,
    isComplete: false,
    completionTime: 0,
    showHint: true,
  };
}

export function useGameLoop() {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const lastTimeRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  
  // Update loop - runs every frame
  const update = useCallback((timestamp: number) => {
    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = timestamp;
    
    setGameState(prev => {
      // Check for completion reset
      if (prev.isComplete) {
        if (timestamp - prev.completionTime > GAME_CONFIG.COMPLETION_DELAY) {
          return createInitialState();
        }
        return prev;
      }
      
      // Hide hint after duration
      const showHint = prev.showHint && timestamp < GAME_CONFIG.HINT_DISPLAY_DURATION;
      
      // Update nodes
      const nodes = prev.nodes.map(node => {
        if (node.locked) {
          // Update lock animation
          const lockProgress = Math.min(1, node.lockAnimationProgress + deltaTime / (GAME_CONFIG.LOCK_ANIMATION_DURATION / 1000));
          
          // Update ripple
          let rippleProgress = node.rippleProgress;
          let rippleActive = node.rippleActive;
          if (rippleActive) {
            rippleProgress += deltaTime / (GAME_CONFIG.RIPPLE_DURATION / 1000);
            if (rippleProgress >= 1) {
              rippleActive = false;
              rippleProgress = 0;
            }
          }
          
          return {
            ...node,
            lockAnimationProgress: lockProgress,
            rippleProgress,
            rippleActive,
          };
        }
        
        // Smoothly interpolate frequency toward target
        const frequencyLerp = 0.05;
        const newFrequency = node.frequency + (node.targetFrequency - node.frequency) * frequencyLerp;
        
        // Update phase
        let newPhase = node.phase + newFrequency * deltaTime;
        newPhase = newPhase % 1;
        if (newPhase < 0) newPhase += 1;
        
        return {
          ...node,
          phase: newPhase,
          frequency: newFrequency,
        };
      });
      
      // Check completion
      const isComplete = nodes.every(n => n.locked);
      
      return {
        nodes,
        isComplete,
        completionTime: isComplete && !prev.isComplete ? timestamp : prev.completionTime,
        showHint,
      };
    });
    
    frameRef.current = requestAnimationFrame(update);
  }, []);
  
  // Start animation loop
  useEffect(() => {
    frameRef.current = requestAnimationFrame(update);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [update]);
  
  // Handle tap on a node
  const handleNodeTap = useCallback((nodeId: number) => {
    setGameState(prev => {
      const node = prev.nodes.find(n => n.id === nodeId);
      if (!node || node.locked) return prev;
      
      // Check if node is in active state
      if (!isNodeActive(node)) {
        // Incorrect tap - do nothing (no negative feedback)
        return prev;
      }
      
      // Successful lock!
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            locked: true,
            lockAnimationProgress: 0,
            rippleActive: true,
            rippleProgress: 0,
          };
        }
        
        // Apply slowdown to neighbors
        if (!n.locked) {
          const distance = getNodeDistance(node, n);
          if (distance < GAME_CONFIG.SLOWDOWN_RADIUS) {
            const slowdownFactor = 1 - GAME_CONFIG.SLOWDOWN_PER_LOCK;
            return {
              ...n,
              targetFrequency: n.targetFrequency * slowdownFactor,
            };
          }
        }
        
        return n;
      });
      
      return {
        ...prev,
        nodes: updatedNodes,
      };
    });
  }, []);
  
  // Manual reset
  const resetGame = useCallback(() => {
    setGameState(createInitialState());
    lastTimeRef.current = 0;
  }, []);
  
  return {
    gameState,
    handleNodeTap,
    resetGame,
  };
}
