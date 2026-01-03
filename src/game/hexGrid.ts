// Hexagonal grid generation and triangle detection
import { Bubble, Triangle, CONFIG } from './types';

// Axial coordinate directions for hex grid (pointy-top)
const HEX_DIRECTIONS = [
  { q: 1, r: 0 },   // E
  { q: 1, r: -1 },  // NE
  { q: 0, r: -1 },  // NW
  { q: -1, r: 0 },  // W
  { q: -1, r: 1 },  // SW
  { q: 0, r: 1 },   // SE
];

// Convert axial to pixel coordinates (pointy-top hex)
export function axialToPixel(q: number, r: number, spacing: number): { x: number; y: number } {
  const x = spacing * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
  const y = spacing * (3 / 2 * r);
  return { x, y };
}

// Generate hexagonal grid with given number of rings
export function generateHexGrid(rings: number): Bubble[] {
  const bubbles: Bubble[] = [];
  let id = 0;
  
  // Generate all positions in the hex grid
  const positions: { q: number; r: number }[] = [];
  
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      // Check if within hex bounds (cube coordinate constraint: q + r + s = 0, |s| <= rings)
      const s = -q - r;
      if (Math.abs(s) <= rings) {
        positions.push({ q, r });
      }
    }
  }
  
  // Create bubbles
  positions.forEach(({ q, r }) => {
    const { x, y } = axialToPixel(q, r, CONFIG.BUBBLE_SPACING);
    const isCentral = q === 0 && r === 0;
    
    bubbles.push({
      id: id++,
      q,
      r,
      x,
      y,
      state: isCentral ? 1 : Math.floor(Math.random() * (CONFIG.INITIAL_STATE_MAX - CONFIG.INITIAL_STATE_MIN + 1)) + CONFIG.INITIAL_STATE_MIN,
      stateFloat: isCentral ? 1 : 0, // Will be set properly
      support: false,
      supportTimer: 0,
      isCentral,
      neighbors: [],
      pulsePhase: Math.random(), // Random starting phase
    });
  });
  
  // Set stateFloat to match state
  bubbles.forEach(b => {
    b.stateFloat = b.state;
  });
  
  // Find neighbors for each bubble
  bubbles.forEach(bubble => {
    HEX_DIRECTIONS.forEach(dir => {
      const neighborQ = bubble.q + dir.q;
      const neighborR = bubble.r + dir.r;
      const neighbor = bubbles.find(b => b.q === neighborQ && b.r === neighborR);
      if (neighbor) {
        bubble.neighbors.push(neighbor.id);
      }
    });
  });
  
  return bubbles;
}

// Find all valid triangles in the grid
// A triangle is 3 bubbles where each is a neighbor of the other two
export function findAllTriangles(bubbles: Bubble[]): Triangle[] {
  const triangles: Triangle[] = [];
  const seen = new Set<string>();
  let triangleId = 0;
  
  bubbles.forEach(bubble => {
    // For each pair of neighbors, check if they're also neighbors of each other
    for (let i = 0; i < bubble.neighbors.length; i++) {
      for (let j = i + 1; j < bubble.neighbors.length; j++) {
        const neighborA = bubbles.find(b => b.id === bubble.neighbors[i])!;
        const neighborB = bubbles.find(b => b.id === bubble.neighbors[j])!;
        
        // Check if A and B are neighbors
        if (neighborA.neighbors.includes(neighborB.id)) {
          // Found a triangle! Create sorted key to avoid duplicates
          const ids = [bubble.id, neighborA.id, neighborB.id].sort((a, b) => a - b);
          const key = ids.join(',');
          
          if (!seen.has(key)) {
            seen.add(key);
            triangles.push({
              id: triangleId++,
              bubbleIds: [ids[0], ids[1], ids[2]],
              activationTimer: 0,
              isProgressing: false,
              justActivated: false,
              activationFadeTimer: 0,
            });
          }
        }
      }
    }
  });
  
  return triangles;
}

// Get the center of a triangle for visual effects
export function getTriangleCenter(triangle: Triangle, bubbles: Bubble[]): { x: number; y: number } {
  const [id1, id2, id3] = triangle.bubbleIds;
  const b1 = bubbles.find(b => b.id === id1)!;
  const b2 = bubbles.find(b => b.id === id2)!;
  const b3 = bubbles.find(b => b.id === id3)!;
  
  return {
    x: (b1.x + b2.x + b3.x) / 3,
    y: (b1.y + b2.y + b3.y) / 3,
  };
}
