import { useCallback, useEffect, useRef, useState } from 'react';
import { 
  BreathingNode, 
  GameState, 
  CONFIG,
  getPhaseEffectiveness,
  calculateSyncDistance,
  getTuningState,
  getNodeDistance,
  AppView
} from './types';

// Generate node positions with natural asymmetry
function generateNodePositions(count: number): { x: number; y: number }[] {
  const { MARGIN_TOP, MARGIN_BOTTOM, MARGIN_HORIZONTAL } = CONFIG;
  
  // Positions for different node counts
  const layouts: Record<number, { x: number; y: number }[]> = {
    1: [{ x: 0.5, y: 0.45 }], // Just anchor, centered
    2: [{ x: 0.5, y: 0.35 }, { x: 0.5, y: 0.65 }],
    3: [{ x: 0.5, y: 0.3 }, { x: 0.3, y: 0.6 }, { x: 0.7, y: 0.65 }],
    4: [
      { x: 0.5, y: 0.25 },  // anchor at top
      { x: 0.28, y: 0.52 }, // left
      { x: 0.72, y: 0.48 }, // right
      { x: 0.5, y: 0.75 },  // bottom
    ],
    5: [
      { x: 0.5, y: 0.22 },
      { x: 0.25, y: 0.45 },
      { x: 0.75, y: 0.42 },
      { x: 0.32, y: 0.72 },
      { x: 0.68, y: 0.75 },
    ],
  };

  const baseLayout = layouts[Math.min(count, 5)] || layouts[4];
  
  return baseLayout.slice(0, count).map(p => ({
    x: MARGIN_HORIZONTAL + p.x * (1 - 2 * MARGIN_HORIZONTAL),
    y: MARGIN_TOP + p.y * (1 - MARGIN_TOP - MARGIN_BOTTOM),
  }));
}

// Create initial game state for arrival
function createInitialState(): GameState {
  return {
    nodes: [],
    currentView: 'arrival',
    sessionPhase: 0,
    configurationsCompleted: 0,
    isTransitioning: false,
    transitionProgress: 0,
    globalBreathPhase: 0,
  };
}

// Create a node configuration for the experience
function createConfiguration(nodeCount: number): BreathingNode[] {
  const positions = generateNodePositions(nodeCount);
  const { UNTUNED_FREQUENCY_MIN, UNTUNED_FREQUENCY_MAX, ANCHOR_FREQUENCY } = CONFIG;
  
  return positions.map((pos, i) => {
    const isAnchor = i === 0;
    const baseFreq = isAnchor 
      ? ANCHOR_FREQUENCY 
      : UNTUNED_FREQUENCY_MIN + Math.random() * (UNTUNED_FREQUENCY_MAX - UNTUNED_FREQUENCY_MIN);
    
    // Create connections (each node connects to anchor and adjacent nodes)
    const connections: number[] = [];
    if (!isAnchor) {
      connections.push(0); // Connect to anchor
      // Connect to neighbors
      if (i > 1) connections.push(i - 1);
      if (i < nodeCount - 1) connections.push(i + 1);
    } else {
      // Anchor connects to all
      for (let j = 1; j < nodeCount; j++) connections.push(j);
    }
    
    return {
      id: i,
      x: pos.x,
      y: pos.y,
      phase: isAnchor ? 0 : Math.random(),
      baseFrequency: baseFreq,
      frequency: baseFreq,
      isAnchor,
      tuningState: isAnchor ? 'settled' : 'untuned',
      tuningProgress: isAnchor ? 1 : 0,
      visualNoise: isAnchor ? 0 : 0.8 + Math.random() * 0.2,
      connections,
      lastTapTime: 0,
      tapRippleProgress: 0,
    };
  });
}

export function useGameLoop() {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const lastTimeRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  
  // Update loop
  const update = useCallback((timestamp: number) => {
    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
    lastTimeRef.current = timestamp;
    
    setGameState(prev => {
      // Update global breath phase
      const newGlobalBreathPhase = (prev.globalBreathPhase + deltaTime / CONFIG.BACKGROUND_BREATH_DURATION) % 1;
      
      // If in arrival or reflection, just update breath
      if (prev.currentView !== 'experience') {
        return {
          ...prev,
          globalBreathPhase: newGlobalBreathPhase,
        };
      }
      
      // Find anchor node
      const anchorNode = prev.nodes.find(n => n.isAnchor);
      if (!anchorNode) return prev;
      
      // Update each node
      const nodes = prev.nodes.map(node => {
        // Update phase (all nodes breathe)
        let newPhase = (node.phase + node.frequency * deltaTime) % 1;
        
        // Update tap ripple
        let tapRippleProgress = node.tapRippleProgress;
        if (tapRippleProgress > 0 && tapRippleProgress < 1) {
          tapRippleProgress = Math.min(1, tapRippleProgress + deltaTime / (CONFIG.TAP_RIPPLE_DURATION / 1000));
        } else if (tapRippleProgress >= 1) {
          tapRippleProgress = 0;
        }
        
        // Anchor doesn't need tuning updates
        if (node.isAnchor) {
          return { ...node, phase: newPhase, tapRippleProgress };
        }
        
        // Calculate sync distance to anchor
        const syncDistance = calculateSyncDistance(node, anchorNode);
        
        // Update tuning progress based on how close we are
        let newTuningProgress = node.tuningProgress;
        
        // Passive drift toward anchor for listening+ nodes
        if (node.tuningState !== 'untuned') {
          newTuningProgress = Math.min(1, newTuningProgress + CONFIG.PASSIVE_DRIFT_RATE * deltaTime);
        }
        
        // Neighbor influence - settled neighbors pull toward sync
        const settledNeighbors = node.connections
          .map(id => prev.nodes.find(n => n.id === id))
          .filter(n => n && n.tuningState === 'settled');
        
        if (settledNeighbors.length > 0) {
          newTuningProgress = Math.min(1, newTuningProgress + CONFIG.NEIGHBOR_INFLUENCE_RATE * settledNeighbors.length * deltaTime);
        }
        
        // Interpolate frequency toward anchor based on tuning progress
        const targetFreq = node.baseFrequency + (anchorNode.frequency - node.baseFrequency) * newTuningProgress;
        const newFrequency = node.frequency + (targetFreq - node.frequency) * 0.02;
        
        // Nudge phase toward anchor when synchronizing
        if (node.tuningState === 'synchronizing' || node.tuningState === 'settled') {
          let phaseDiff = anchorNode.phase - newPhase;
          if (phaseDiff > 0.5) phaseDiff -= 1;
          if (phaseDiff < -0.5) phaseDiff += 1;
          newPhase = (newPhase + phaseDiff * 0.01 + 1) % 1;
        }
        
        // Update visual noise
        const newVisualNoise = Math.max(0, node.visualNoise - CONFIG.NOISE_DECAY_RATE * newTuningProgress * deltaTime);
        
        // Determine tuning state
        const newTuningState = getTuningState(newTuningProgress);
        
        return {
          ...node,
          phase: newPhase,
          frequency: newFrequency,
          tuningProgress: newTuningProgress,
          tuningState: newTuningState,
          visualNoise: newVisualNoise,
          tapRippleProgress,
        };
      });
      
      // Check if all nodes are settled (configuration complete)
      const allSettled = nodes.every(n => n.tuningState === 'settled');
      let newSessionPhase = prev.sessionPhase;
      let newConfigurationsCompleted = prev.configurationsCompleted;
      let isTransitioning = prev.isTransitioning;
      let transitionProgress = prev.transitionProgress;
      let currentView: AppView = prev.currentView;
      
      if (allSettled && !isTransitioning) {
        isTransitioning = true;
        transitionProgress = 0;
        newConfigurationsCompleted++;
      }
      
      if (isTransitioning) {
        transitionProgress = Math.min(1, transitionProgress + deltaTime / (CONFIG.CONFIGURATION_TRANSITION_DURATION / 1000));
        if (transitionProgress >= 1) {
          isTransitioning = false;
          transitionProgress = 0;
          
          if (newConfigurationsCompleted >= CONFIG.CONFIGURATIONS_PER_SESSION) {
            // Session complete - go to reflection
            currentView = 'reflection';
          } else {
            // Generate new configuration
            return {
              ...prev,
              nodes: createConfiguration(CONFIG.FULL_NODE_COUNT),
              sessionPhase: newSessionPhase,
              configurationsCompleted: newConfigurationsCompleted,
              isTransitioning: false,
              transitionProgress: 0,
              globalBreathPhase: newGlobalBreathPhase,
            };
          }
        }
      }
      
      return {
        ...prev,
        nodes,
        currentView,
        sessionPhase: newSessionPhase,
        configurationsCompleted: newConfigurationsCompleted,
        isTransitioning,
        transitionProgress,
        globalBreathPhase: newGlobalBreathPhase,
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
      if (!node || node.isAnchor || node.tuningState === 'settled') return prev;
      
      const anchorNode = prev.nodes.find(n => n.isAnchor);
      if (!anchorNode) return prev;
      
      // Calculate tap effectiveness based on phase
      const effectiveness = getPhaseEffectiveness(node.phase);
      const nudgeAmount = CONFIG.TAP_NUDGE_STRENGTH * effectiveness;
      
      // Update the tapped node
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          const newTuningProgress = Math.min(1, n.tuningProgress + nudgeAmount);
          return {
            ...n,
            tuningProgress: newTuningProgress,
            tuningState: getTuningState(newTuningProgress),
            lastTapTime: performance.now(),
            tapRippleProgress: 0.01, // Start ripple
          };
        }
        return n;
      });
      
      return {
        ...prev,
        nodes: updatedNodes,
      };
    });
  }, []);
  
  // Start experience (from arrival)
  const startExperience = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      currentView: 'experience',
      nodes: createConfiguration(CONFIG.FULL_NODE_COUNT),
      configurationsCompleted: 0,
      sessionPhase: 0,
    }));
  }, []);
  
  // Return to arrival (from reflection)
  const returnToArrival = useCallback(() => {
    setGameState(createInitialState());
  }, []);
  
  return {
    gameState,
    handleNodeTap,
    startExperience,
    returnToArrival,
  };
}
