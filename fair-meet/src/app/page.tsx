"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [locationA, setLocationA] = useState("");
  const [locationB, setLocationB] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResults(null);

    if (!locationA.trim() || !locationB.trim()) {
      setError("Please enter both locations");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationA: locationA,
          locationB: locationB,
          includeVenues: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to calculate");
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      console.error("Error calculating:", err);
      setError(err.message || "Failed to calculate meeting points. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (results) {
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

          <div className="space-y-4 mb-6">
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

                <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
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
                  className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Directions
                </a>
              </div>
            ))}
          </div>

          {(!results.recommendations || results.recommendations.length === 0) && (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center mb-6">
              <p className="text-slate-600">
                No suitable meeting points found. Try different locations.
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setResults(null);
              setLocationA("");
              setLocationB("");
            }}
            className="w-full bg-slate-600 text-white py-3 px-4 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Start New Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Fair-Meet
          </h1>
          <p className="text-lg text-slate-600">
            Find the fairest place to meet in London
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <form onSubmit={handleCalculate} className="space-y-4">
            <div>
              <label
                htmlFor="locationA"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Person A's postcode
              </label>
              <input
                id="locationA"
                type="text"
                value={locationA}
                onChange={(e) => setLocationA(e.target.value)}
                placeholder="E.g., E14 5AB"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="locationB"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Person B's postcode
              </label>
              <input
                id="locationB"
                type="text"
                value={locationB}
                onChange={(e) => setLocationB(e.target.value)}
                placeholder="E.g., N1 9AG"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Calculating..." : "Find Fair Meeting Points"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">
            How it works:
          </h2>
          <ol className="space-y-2 text-slate-600">
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">1.</span>
              <span>Enter both UK postcodes</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">2.</span>
              <span>We calculate journey times via Tube & Elizabeth Line</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">3.</span>
              <span>See the top 3 fairest meeting points instantly</span>
            </li>
          </ol>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <p className="text-sm text-blue-900 font-medium mb-2">
            Try these test postcodes:
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Canary Wharf area: <code className="bg-blue-100 px-1 rounded">E14 5AB</code></li>
            <li>• Westminster area: <code className="bg-blue-100 px-1 rounded">SW1A 1AA</code></li>
            <li>• King's Cross area: <code className="bg-blue-100 px-1 rounded">N1 9AG</code></li>
          </ul>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Stop the "where should we meet?" back-and-forth.
          <br />
          Get a fair answer in 10 seconds.
        </p>
      </div>
    </div>
  );
}
