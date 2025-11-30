/**
 * Fairness Algorithm for Fair-Meet
 * Calculates the fairness score for meeting points based on journey times
 */

import { VenueCounts, calculateVenueScore } from './places';

export interface MeetingPoint {
  stationId: string;
  stationName: string;
  lat: number;
  lon: number;
  timeFromA: number; // minutes
  timeFromB: number; // minutes
  timeDifference: number; // minutes
  totalTime: number; // minutes
  fairnessScore: number; // 0-100
  venueScore?: number;
  venueCounts?: VenueCounts;
  finalScore?: number;
}

/**
 * Calculate fairness score based on journey times
 * Formula from PRD:
 * fairness_score = 100 - (
 *   (abs(time_a - time_b) / max(time_a, time_b)) * 50 +  // Time difference penalty
 *   (total_time / 90) * 50                                 // Total time penalty
 * )
 */
export function calculateFairnessScore(
  timeA: number,
  timeB: number
): number {
  const timeDiff = Math.abs(timeA - timeB);
  const maxTime = Math.max(timeA, timeB);
  const totalTime = timeA + timeB;

  // Apply constraints from PRD
  if (totalTime > 90) return 0; // Discard if total > 90 minutes
  if (maxTime > 60) return 0; // Discard if any individual > 60 minutes

  const timeDiffPenalty = (timeDiff / maxTime) * 50;
  const totalTimePenalty = (totalTime / 90) * 50;

  const score = 100 - (timeDiffPenalty + totalTimePenalty);
  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
}

/**
 * Calculate final score combining fairness and venue quality
 * PRD: final_score = fairness_score * 0.7 + venue_score * 0.3
 */
export function calculateFinalScore(
  fairnessScore: number,
  venueScore: number
): number {
  return fairnessScore * 0.7 + venueScore * 0.3;
}

/**
 * Rank meeting points by fairness (and optionally venue scores)
 */
export function rankMeetingPoints(
  points: MeetingPoint[],
  includeVenues: boolean = false
): MeetingPoint[] {
  // Filter out invalid points
  const validPoints = points.filter(p => p.fairnessScore > 0);

  // Sort by final score (or fairness if no venue data)
  const sorted = validPoints.sort((a, b) => {
    const scoreA = includeVenues && a.finalScore !== undefined
      ? a.finalScore
      : a.fairnessScore;
    const scoreB = includeVenues && b.finalScore !== undefined
      ? b.finalScore
      : b.fairnessScore;
    return scoreB - scoreA;
  });

  return sorted;
}

/**
 * Get top N meeting points
 */
export function getTopMeetingPoints(
  points: MeetingPoint[],
  count: number = 3,
  includeVenues: boolean = false
): MeetingPoint[] {
  const ranked = rankMeetingPoints(points, includeVenues);
  return ranked.slice(0, count);
}

/**
 * Check if a meeting point meets the "good" criteria
 * PRD: Prefer difference < 10 minutes
 */
export function isGoodMeetingPoint(point: MeetingPoint): boolean {
  return (
    point.fairnessScore > 70 &&
    point.timeDifference < 10 &&
    point.totalTime < 60
  );
}
