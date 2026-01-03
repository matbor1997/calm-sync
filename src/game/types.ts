// Triangle-based system regulation game types

export interface Bubble {
  id: number;
  // Grid position (axial coordinates for hex grid)
  q: number;
  r: number;
  // Screen position (computed from q,r)
  x: number;
  y: number;
  // State: 1 (calm) to 8 (chaotic)
  state: number;
  // Internal float for smooth transitions
  stateFloat: number;
  // Support state
  support: boolean;
  supportTimer: number;
  // Is this the central anchor bubble?
  isCentral: boolean;
  // Neighbor IDs
  neighbors: number[];
  // Visual animation phase
  pulsePhase: number;
}

export interface Triangle {
  id: number;
  bubbleIds: [number, number, number];
  // Timer for activation (needs 1.5s of conditions met)
  activationTimer: number;
  // Is currently progressing toward activation
  isProgressing: boolean;
  // Just activated (for visual feedback)
  justActivated: boolean;
  activationFadeTimer: number;
}

export interface GameState {
  bubbles: Bubble[];
  triangles: Triangle[];
  isComplete: boolean;
  completionTime: number;
}

// Configuration constants
export const CONFIG = {
  // Grid size (rings around center)
  GRID_RINGS: 2, // Creates ~19 bubbles
  
  // State range
  STATE_MIN: 1,
  STATE_MAX: 8,
  
  // Support duration
  SUPPORT_DURATION: 1.5, // seconds
  
  // Triangle activation time
  TRIANGLE_ACTIVATION_TIME: 1.5, // seconds
  
  // Drift rate (state increase per second)
  DRIFT_RATE: 0.15, // per second
  
  // Visual sizing
  BUBBLE_RADIUS: 28,
  BUBBLE_SPACING: 72, // Distance between bubble centers
  
  // Pulse speeds based on state (cycles per second)
  PULSE_SPEED_MIN: 0.08, // State 1 (very calm)
  PULSE_SPEED_MAX: 1.2,  // State 8 (chaotic)
  
  // Starting states
  INITIAL_STATE_MIN: 3,
  INITIAL_STATE_MAX: 6,
  
  // Activation effect duration
  ACTIVATION_FADE_DURATION: 0.8,
} as const;

// Get pulse speed for a given state
export function getPulseSpeed(state: number): number {
  const t = (state - CONFIG.STATE_MIN) / (CONFIG.STATE_MAX - CONFIG.STATE_MIN);
  return CONFIG.PULSE_SPEED_MIN + t * (CONFIG.PULSE_SPEED_MAX - CONFIG.PULSE_SPEED_MIN);
}

// Get color based on state
export function getStateColor(state: number): { h: number; s: number; l: number } {
  // State 1: calm blue-green, State 8: warm orange-red
  const t = (state - CONFIG.STATE_MIN) / (CONFIG.STATE_MAX - CONFIG.STATE_MIN);
  return {
    h: 180 - t * 140, // 180 (cyan) to 40 (orange)
    s: 45 + t * 25,   // 45% to 70%
    l: 55 + t * 10,   // 55% to 65%
  };
}
