
import { Position } from './types';

/**
 * Calculates the distance between two points using the Pythagorean theorem.
 */
export const getDistance = (p1: Position, p2: Position): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Linearly interpolates between two values.
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

/**
 * Standard game loop interpolation helper.
 */
export const moveTowards = (current: number, target: number, maxStep: number): number => {
  const diff = target - current;
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
};
