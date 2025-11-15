/**
 * Metric Calculation Utilities
 *
 * Pure mathematical functions for calculating progressive metric values
 * and determining status levels. No side effects or game state dependencies.
 */

/**
 * Calculate progressive metric value using sigmoid curve
 *
 * Formula: min + (max - min) / (1 + e^(-k * (day - midpoint)))
 *
 * This creates a smooth S-curve progression where:
 * - Values start near `min` at day 1
 * - Values grow slowly at first, then rapidly around `midpoint`
 * - Values plateau near `max` as we approach day 24
 *
 * @param min - Minimum value at Day 1
 * @param max - Maximum value at Day 24
 * @param day - Current day (1-24)
 * @param k - Steepness parameter (default 0.4) - higher = steeper curve
 * @param midpoint - Inflection point (default 12) - where rapid growth occurs
 * @returns Calculated metric value rounded to nearest integer
 *
 * @example
 * // Calculate gift production on day 12
 * calculateSigmoidValue(100, 1000, 12) // ~550
 *
 * @example
 * // Steeper curve for urgent metrics
 * calculateSigmoidValue(0, 100, 18, 0.6) // More dramatic growth
 */
export function calculateSigmoidValue(
  min: number,
  max: number,
  day: number,
  k: number = 0.4,
  midpoint: number = 12,
): number {
  const sigmoid = 1 / (1 + Math.exp(-k * (day - midpoint)));
  const value = min + (max - min) * sigmoid;
  return Math.round(value);
}

/**
 * Determine metric status based on value and thresholds
 *
 * Status thresholds:
 * - kritisk: < 50% of max (critical)
 * - advarsel: 50-74% of max (warning)
 * - normal: >= 75% of max (healthy)
 *
 * @param value - Current metric value
 * @param max - Maximum possible value
 * @returns Status level for UI display
 *
 * @example
 * getMetricStatus(300, 1000) // "kritisk" (30%)
 * getMetricStatus(650, 1000) // "advarsel" (65%)
 * getMetricStatus(900, 1000) // "normal" (90%)
 */
export function getMetricStatus(
  value: number,
  max: number,
): "normal" | "advarsel" | "kritisk" {
  const percentage = (value / max) * 100;
  if (percentage < 50) return "kritisk";
  if (percentage < 75) return "advarsel";
  return "normal";
}
