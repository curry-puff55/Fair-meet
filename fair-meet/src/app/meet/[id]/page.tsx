"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/db";
import { type AppSchema } from "@/instant.schema";
import { InstaQLEntity } from "@instantdb/react";

type Session = InstaQLEntity<AppSchema, "sessions">;

export default function MeetPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [locationB, setLocationB] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Subscribe to session updates in real-time
  const { isLoading, error: queryError, data } = db.useQuery({
    sessions: {
      $: {
        where: {
          id: sessionId,
        },
      },
    },
  });

  const session = data?.sessions?.[0];

  // Calculate meeting points when both locations are set
  useEffect(() => {
    if (
      session?.status === "waiting_for_b" &&
      session.user_b_location &&
      !isCalculating
    ) {
      calculateMeetingPoints();
    }
  }, [session?.user_b_location]);

  const calculateMeetingPoints = async () => {
    if (!session) return;

    setIsCalculating(true);

    try {
      // Update status to calculating
      await db.transact(
        db.tx.sessions[sessionId].update({
          status: "calculating",
        })
      );

      // Call the calculate API
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationA: session.user_a_location,
          locationB: session.user_b_location,
          includeVenues: false, // Set to false for MVP to speed up calculations
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate meeting points");
      }

      const results = await response.json();

      // Update session with results
      await db.transact(
        db.tx.sessions[sessionId].update({
          status: "complete",
          results: results,
        })
      );
    } catch (err) {
      console.error("Error calculating:", err);
      setError("Failed to calculate meeting points. Please try again.");
      await db.transact(
        db.tx.sessions[sessionId].update({
          status: "waiting_for_b",
        })
      );
    } finally {
      setIsCalculating(false);
    }
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!locationB.trim()) {
      setError("Please enter your location");
      return;
    }

    setIsSubmitting(true);

    try {
      await db.transact(
        db.tx.sessions[sessionId].update({
          user_b_location: locationB,
        })
      );
    } catch (err) {
      console.error("Error joining session:", err);
      setError("Failed to join session. Please try again.");
      setIsSubmitting(false);
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (queryError || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Session Not Found
          </h2>
          <p className="text-slate-600">
            This session doesn't exist or has expired.
          </p>
        </div>
      </div>
    );
  }

  // User A waiting for User B
  if (session.status === "waiting_for_b" && !session.user_b_location) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Share with your friend
            </h2>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">Your location:</p>
              <p className="font-medium text-slate-900">
                {session.user_a_location}
              </p>
            </div>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                Share this link with your friend:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  readOnly
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                />
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-slate-500 text-sm">
                Waiting for them to add their location...
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-pulse flex space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User B joining the session
  if (!session.user_b_location) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Join Meetup
            </h2>

            <div className="mb-6">
              <p className="text-sm text-slate-600 mb-2">
                Your friend's location:
              </p>
              <p className="font-medium text-slate-900">
                {session.user_a_location}
              </p>
            </div>

            <form onSubmit={handleJoinSession} className="space-y-4">
              <div>
                <label
                  htmlFor="locationB"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Your location
                </label>
                <input
                  id="locationB"
                  type="text"
                  value={locationB}
                  onChange={(e) => setLocationB(e.target.value)}
                  placeholder="Enter postcode or station name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Joining..." : "Find Meeting Points"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Calculating
  if (session.status === "calculating" || isCalculating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Calculating...
          </h2>
          <p className="text-slate-600 mb-6">
            Finding the fairest meeting points for you
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // Results
  if (session.status === "complete" && session.results) {
    const results = session.results as any;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Your Fair Meeting Points
            </h1>
            <p className="text-slate-600">
              Based on journey times via Tube & Elizabeth Line
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-slate-600 mb-1">Location A</p>
              <p className="font-semibold text-slate-900">
                {results.locationA?.input}
              </p>
              <p className="text-xs text-slate-500">
                Nearest: {results.locationA?.nearestStation?.name}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-slate-600 mb-1">Location B</p>
              <p className="font-semibold text-slate-900">
                {results.locationB?.input}
              </p>
              <p className="text-xs text-slate-500">
                Nearest: {results.locationB?.nearestStation?.name}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {results.recommendations?.map((point: any, index: number) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        #{index + 1}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900">
                        {point.stationName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-slate-600">
                        Fairness Score:
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {Math.round(point.fairnessScore)}/100
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-xs text-slate-600 mb-1">Person A</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {point.timeFromA} min
                    </p>
                  </div>
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-xs text-slate-600 mb-1">Person B</p>
                    <p className="text-2xl font-bold text-green-600">
                      {point.timeFromB} min
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Time difference: <strong>{point.timeDifference} min</strong>
                  </span>
                  <span>
                    Total: <strong>{point.totalTime} min</strong>
                  </span>
                </div>

                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(point.stationName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Directions
                </a>
              </div>
            ))}
          </div>

          {(!results.recommendations || results.recommendations.length === 0) && (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <p className="text-slate-600">
                No suitable meeting points found. Try different locations.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
