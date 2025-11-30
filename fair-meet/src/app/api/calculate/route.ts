import { NextRequest, NextResponse } from 'next/server';
import { geocodeLocation } from '@/lib/geocode';
import { findNearestStation, getAllStations, getJourneyTime } from '@/lib/tfl';
import { getVenueCounts, calculateVenueScore } from '@/lib/places';
import {
  calculateFairnessScore,
  calculateFinalScore,
  getTopMeetingPoints,
  MeetingPoint,
} from '@/lib/fairness';

/**
 * API Route: /api/calculate
 * Main algorithm: Calculate fair meeting points for two people
 */
export async function POST(request: NextRequest) {
  try {
    const { locationA, locationB, includeVenues = true } = await request.json();

    if (!locationA || !locationB) {
      return NextResponse.json(
        { error: 'Both locations are required' },
        { status: 400 }
      );
    }

    console.log('Calculating meeting points for:', locationA, locationB);

    // Step 1: Geocode both locations
    const [coordsA, coordsB] = await Promise.all([
      geocodeLocation(locationA),
      geocodeLocation(locationB),
    ]);

    if (!coordsA) {
      console.error(`Failed to geocode location A: ${locationA}`);
      return NextResponse.json(
        { error: `Please enter a valid UK postcode for Location A. Example: E14 5AB, N1 9AG, SW1A 1AA` },
        { status: 400 }
      );
    }

    if (!coordsB) {
      console.error(`Failed to geocode location B: ${locationB}`);
      return NextResponse.json(
        { error: `Please enter a valid UK postcode for Location B. Example: E14 5AB, N1 9AG, SW1A 1AA` },
        { status: 400 }
      );
    }

    console.log('Geocoded:', coordsA, coordsB);

    // Step 2: Find nearest stations for each person
    const [stationA, stationB] = await Promise.all([
      findNearestStation(coordsA.lat, coordsA.lon),
      findNearestStation(coordsB.lat, coordsB.lon),
    ]);

    if (!stationA || !stationB) {
      return NextResponse.json(
        { error: 'Could not find nearest stations. Are both locations in London?' },
        { status: 404 }
      );
    }

    console.log('Nearest stations:', stationA.name, stationB.name);

    // Step 3: Get all candidate stations
    // For MVP, we'll use a subset of major interchange stations
    // In production, this could be optimized with spatial queries
    const allStations = await getAllStations();

    // For MVP: limit to major stations to reduce API calls
    const majorStations = allStations.filter(s =>
      s.name.includes('King') ||
      s.name.includes('Liverpool') ||
      s.name.includes('Oxford') ||
      s.name.includes('Victoria') ||
      s.name.includes('Paddington') ||
      s.name.includes('Waterloo') ||
      s.name.includes('London Bridge') ||
      s.name.includes('Canary Wharf') ||
      s.name.includes('Stratford') ||
      s.name.includes('Green Park') ||
      s.name.includes('Westminster') ||
      s.name.includes('Leicester Square')
    ).slice(0, 20); // Limit to 20 for MVP

    console.log('Evaluating', majorStations.length, 'candidate stations');

    // Step 4: Calculate journey times for each candidate
    const meetingPoints: MeetingPoint[] = [];

    for (const station of majorStations) {
      // Calculate journey times from both starting stations to this candidate
      const [journeyA, journeyB] = await Promise.all([
        getJourneyTime(stationA.id, station.id),
        getJourneyTime(stationB.id, station.id),
      ]);

      if (!journeyA || !journeyB) continue;

      const timeA = journeyA.duration;
      const timeB = journeyB.duration;
      const timeDiff = Math.abs(timeA - timeB);
      const totalTime = timeA + timeB;

      // Calculate fairness score
      const fairnessScore = calculateFairnessScore(timeA, timeB);

      if (fairnessScore === 0) continue; // Skip invalid points

      const point: MeetingPoint = {
        stationId: station.id,
        stationName: station.name,
        lat: station.lat,
        lon: station.lon,
        timeFromA: timeA,
        timeFromB: timeB,
        timeDifference: timeDiff,
        totalTime,
        fairnessScore,
      };

      meetingPoints.push(point);
    }

    console.log('Found', meetingPoints.length, 'valid meeting points');

    // Step 5: Get top 3 by fairness
    let topPoints = getTopMeetingPoints(meetingPoints, 3, false);

    // Step 6: Add venue data if requested
    if (includeVenues) {
      for (const point of topPoints) {
        const venueCounts = await getVenueCounts(point.lat, point.lon);
        const venueScore = calculateVenueScore(venueCounts);
        point.venueCounts = venueCounts;
        point.venueScore = venueScore;
        point.finalScore = calculateFinalScore(point.fairnessScore, venueScore);
      }

      // Re-rank with venue scores
      topPoints = getTopMeetingPoints(topPoints, 3, true);
    }

    return NextResponse.json({
      success: true,
      locationA: {
        input: locationA,
        coords: coordsA,
        nearestStation: stationA,
      },
      locationB: {
        input: locationB,
        coords: coordsB,
        nearestStation: stationB,
      },
      recommendations: topPoints,
      calculatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Calculate API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
