// Breathing synchronization system types

// Tuning states - implicit progression
export type TuningState = 'untuned' | 'listening' | 'synchronizing' | 'settled';

// Application views
export type AppView = 'arrival' | 'experience' | 'reflection';

// Node structure for breathing synchronization
export interface BreathingNode {
  id: number;
  // Normalized position (0-1)
  x: number;
  y: number;
  // Phase in breath cycle [0..1)
  phase: number;
  // Base frequency (cycles per second) - target for tuning
  baseFrequency: number;
  // Current frequency (will interpolate toward anchor)
  frequency: number;
  // Is this the anchor node (reference rhythm)?
  isAnchor: boolean;
  // Current tuning state
  tuningState: TuningState;
  // Tuning progress (0-1) - how close to anchor rhythm
  tuningProgress: number;
  // Visual noise level (decreases as tuning progresses)
  visualNoise: number;
  // Connected node IDs
  connections: number[];
  // Animation states
  lastTapTime: number;
  tapRippleProgress: number;
}

export interface GameState {
  nodes: BreathingNode[];
  currentView: AppView;
  sessionPhase: number; // 0-1 progress through current configuration
  configurationsCompleted: number;
  isTransitioning: boolean;
  transitionProgress: number;
  globalBreathPhase: number; // Background breathing
}

// Tuning parameters - easy to adjust
export const CONFIG = {
  // Node configuration
  INITIAL_NODE_COUNT: 1, // Start with just anchor during onboarding
  FULL_NODE_COUNT: 4,
  
  // Anchor (reference) rhythm
  ANCHOR_FREQUENCY: 0.125, // 8-second breath cycle (very calm)
  ANCHOR_PHASE_TOLERANCE: 0.15, // How close phase needs to be to count as synced
  
  // Starting frequencies for untuned nodes (erratic)
  UNTUNED_FREQUENCY_MIN: 0.18,
  UNTUNED_FREQUENCY_MAX: 0.35,
  
  // Tuning mechanics
  TAP_NUDGE_STRENGTH: 0.08, // How much a tap nudges toward sync
  PHASE_SENSITIVITY_PEAK: 0.15, // Tap at breath peak/trough is most effective
  PASSIVE_DRIFT_RATE: 0.002, // Slow natural tendency toward sync when listening
  NEIGHBOR_INFLUENCE_RATE: 0.015, // How much settled neighbors pull others
  
  // Tuning thresholds
  LISTENING_THRESHOLD: 0.15, // tuningProgress to enter listening
  SYNCHRONIZING_THRESHOLD: 0.45, // tuningProgress to enter synchronizing
  SETTLED_THRESHOLD: 0.92, // tuningProgress to be settled
  
  // Session structure
  CONFIGURATIONS_PER_SESSION: 3,
  CONFIGURATION_TRANSITION_DURATION: 3000, // ms
  
  // Visual sizing
  NODE_RADIUS_BASE: 0.09,
  NODE_RADIUS_MIN: 44,
  NODE_RADIUS_MAX: 65,
  ANCHOR_RADIUS_MULTIPLIER: 1.15,
  TOUCH_TARGET_MULTIPLIER: 1.3,
  
  // Safe areas
  MARGIN_TOP: 0.18,
  MARGIN_BOTTOM: 0.18,
  MARGIN_HORIZONTAL: 0.14,
  
  // Timing
  BACKGROUND_BREATH_DURATION: 10, // seconds
  ARRIVAL_FADE_DELAY: 2000, // ms before text appears
  ARRIVAL_FADE_DURATION: 3000, // ms for text to fade out
  REFLECTION_DELAY: 2000, // ms before showing reflection
  
  // Animation
  TAP_RIPPLE_DURATION: 800, // ms
  NOISE_DECAY_RATE: 0.3, // How fast visual noise fades per tuning progress
} as const;

// Calculate phase sensitivity multiplier for tap effectiveness
// Taps near peak (phase ~0) or trough (phase ~0.5) are more effective
export function getPhaseEffectiveness(phase: number): number {
  // Distance from nearest peak/trough
  const distFromPeak = Math.min(phase, Math.abs(phase - 0.5), 1 - phase);
  // Convert to effectiveness (1 at peaks, lower in between)
  const effectiveness = 1 - (distFromPeak / 0.25) * 0.4;
  return Math.max(0.6, effectiveness); // Never below 60% effectiveness
}

// Calculate how close a node is to being synchronized with anchor
export function calculateSyncDistance(node: BreathingNode, anchorNode: BreathingNode): number {
  // Frequency difference (normalized)
  const freqDiff = Math.abs(node.frequency - anchorNode.frequency) / anchorNode.frequency;
  
  // Phase difference (accounting for wrap-around)
  let phaseDiff = Math.abs(node.phase - anchorNode.phase);
  if (phaseDiff > 0.5) phaseDiff = 1 - phaseDiff;
  
  // Combined distance (frequency matters more)
  return freqDiff * 0.7 + phaseDiff * 0.3;
}

// Get tuning state based on progress
export function getTuningState(progress: number): TuningState {
  if (progress >= CONFIG.SETTLED_THRESHOLD) return 'settled';
  if (progress >= CONFIG.SYNCHRONIZING_THRESHOLD) return 'synchronizing';
  if (progress >= CONFIG.LISTENING_THRESHOLD) return 'listening';
  return 'untuned';
}

// Calculate node distance (for connections)
export function getNodeDistance(a: BreathingNode, b: BreathingNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
