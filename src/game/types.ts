// Node structure for the calm puzzle game
export interface GameNode {
  id: number;
  // Normalized position (0-1)
  x: number;
  y: number;
  // Phase in cycle [0..1)
  phase: number;
  // Cycles per second
  frequency: number;
  // Target frequency for smooth interpolation
  targetFrequency: number;
  // Whether node is stabilized
  locked: boolean;
  // Animation states
  lockAnimationProgress: number;
  rippleActive: boolean;
  rippleProgress: number;
}

export interface GameState {
  nodes: GameNode[];
  isComplete: boolean;
  completionTime: number;
  showHint: boolean;
}

// Tuning parameters - easy to adjust
export const GAME_CONFIG = {
  NODE_COUNT: 4,
  BASE_FREQUENCY_MIN: 0.6, // cycles per second
  BASE_FREQUENCY_MAX: 1.2,
  ACTIVE_WINDOW_SIZE: 0.22, // 22% of cycle is tappable
  ACTIVE_WINDOW_START: 0.0, // Start of active window in phase
  SLOWDOWN_PER_LOCK: 0.15, // 15% speed reduction per lock
  SLOWDOWN_RADIUS: 0.5, // Normalized distance for neighbor detection
  LOCK_ANIMATION_DURATION: 500, // ms
  RIPPLE_DURATION: 600, // ms
  COMPLETION_DELAY: 2000, // ms before auto-reset
  HINT_DISPLAY_DURATION: 3000, // ms
  
  // Visual sizing
  NODE_RADIUS_BASE: 0.08, // Normalized to screen width
  NODE_RADIUS_MIN: 40, // Minimum pixel radius
  NODE_RADIUS_MAX: 60, // Maximum pixel radius
  TOUCH_TARGET_MULTIPLIER: 1.2, // Larger hit area than visual
  
  // Safe areas
  MARGIN_TOP: 0.15,
  MARGIN_BOTTOM: 0.15,
  MARGIN_HORIZONTAL: 0.12,
} as const;

// Calculate if a node is in its active (tappable) state
export function isNodeActive(node: GameNode): boolean {
  const windowEnd = GAME_CONFIG.ACTIVE_WINDOW_START + GAME_CONFIG.ACTIVE_WINDOW_SIZE;
  return node.phase >= GAME_CONFIG.ACTIVE_WINDOW_START && node.phase < windowEnd;
}

// Calculate distance between two nodes (normalized)
export function getNodeDistance(a: GameNode, b: GameNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
