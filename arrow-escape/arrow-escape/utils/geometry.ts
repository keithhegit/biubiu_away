import { Arrow, Point } from '../types';

/**
 * Calculate the shortest distance from a point to a line segment
 * @param px Point x coordinate
 * @param py Point y coordinate
 * @param x1 Segment start x
 * @param y1 Segment start y
 * @param x2 Segment end x
 * @param y2 Segment end y
 * @returns Distance from point to segment
 */
export function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Segment is actually a point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Calculate projection parameter t
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t)); // Clamp to [0, 1]

  // Calculate closest point on segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  // Return distance
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

/**
 * Calculate the shortest distance from a click point to an arrow's skeleton
 * @param clickX Click x coordinate in pixels
 * @param clickY Click y coordinate in pixels
 * @param arrow The arrow object
 * @param cellSize Size of each grid cell in pixels
 * @returns Shortest distance from click to arrow
 */
export function getDistanceToArrow(
  clickX: number,
  clickY: number,
  arrow: Arrow,
  cellSize: number
): number {
  const segments = arrow.segments;
  if (segments.length === 0) return Infinity;

  let minDistance = Infinity;

  // Iterate through all skeleton segments
  for (let i = 0; i < segments.length - 1; i++) {
    const p1 = segments[i];
    const p2 = segments[i + 1];

    // Convert grid coordinates to pixel coordinates (center of cell)
    const x1 = p1.c * cellSize + cellSize / 2;
    const y1 = p1.r * cellSize + cellSize / 2;
    const x2 = p2.c * cellSize + cellSize / 2;
    const y2 = p2.r * cellSize + cellSize / 2;

    const dist = pointToSegmentDistance(clickX, clickY, x1, y1, x2, y2);
    minDistance = Math.min(minDistance, dist);
  }

  return minDistance;
}
