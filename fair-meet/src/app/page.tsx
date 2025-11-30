"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getWalkingTime } from "@/lib/places";

export default function HomePage() {
  const router = useRouter();
  const [locationA, setLocationA] = useState("");
  const [locationB, setLocationB] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showOnlyOpenNow, setShowOnlyOpenNow] = useState(false);

  // Venue type filters - all enabled by default
  const [venueFilters, setVenueFilters] = useState({
    cafes: true,
    restaurants: true,
    bars: true,
    nightClubs: true,
    movieTheaters: true,
    bowlingAlleys: true,
    museums: true,
    artGalleries: true,
    parks: true,
    shoppingMalls: true,
    casinos: true,
    stadiums: true,
    gyms: true,
    amusementParks: true,
    aquariums: true,
    zoos: true,
    libraries: true,
    touristAttractions: true,
    performingArtsTheaters: true,
    operaHouses: true,
    concertHalls: true,
    philharmonicHalls: true,
    auditoriums: true,
    comedyClubs: true,
    danceHalls: true,
    amphitheatres: true,
    culturalCenters: true,
    culturalLandmarks: true,
    artStudios: true,
    eventVenues: true,
  });

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
          includeVenues: true,
          includeActivities: true,
          venueFilters: venueFilters,
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

  const handleCopyDetails = async (point: any, index: number) => {
    const text = `Meet at ${point.stationName} - Person A: ${point.timeFromA} min, Person B: ${point.timeFromB} min, Fairness: ${Math.round(point.fairnessScore)}/100`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

                {/* Venue Counts */}
                {point.venueCounts && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      Nearby Venues (within 400m)
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {point.venueCounts.cafes > 0 && (
                        <div className="flex items-center gap-2">
                          <span>☕</span>
                          <span>{point.venueCounts.cafes} Cafes</span>
                        </div>
                      )}
                      {point.venueCounts.restaurants > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🍽️</span>
                          <span>{point.venueCounts.restaurants} Restaurants</span>
                        </div>
                      )}
                      {point.venueCounts.bars > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🍺</span>
                          <span>{point.venueCounts.bars} Bars</span>
                        </div>
                      )}
                      {point.venueCounts.nightClubs > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎉</span>
                          <span>{point.venueCounts.nightClubs} Night Clubs</span>
                        </div>
                      )}
                      {point.venueCounts.movieTheaters > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎬</span>
                          <span>{point.venueCounts.movieTheaters} Cinemas</span>
                        </div>
                      )}
                      {point.venueCounts.bowlingAlleys > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎳</span>
                          <span>{point.venueCounts.bowlingAlleys} Bowling</span>
                        </div>
                      )}
                      {point.venueCounts.museums > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🏛️</span>
                          <span>{point.venueCounts.museums} Museums</span>
                        </div>
                      )}
                      {point.venueCounts.artGalleries > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎨</span>
                          <span>{point.venueCounts.artGalleries} Art Galleries</span>
                        </div>
                      )}
                      {point.venueCounts.parks > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🌳</span>
                          <span>{point.venueCounts.parks} Parks</span>
                        </div>
                      )}
                      {point.venueCounts.shoppingMalls > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🛍️</span>
                          <span>{point.venueCounts.shoppingMalls} Shopping</span>
                        </div>
                      )}
                      {point.venueCounts.stadiums > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🏟️</span>
                          <span>{point.venueCounts.stadiums} Stadiums</span>
                        </div>
                      )}
                      {point.venueCounts.gyms > 0 && (
                        <div className="flex items-center gap-2">
                          <span>💪</span>
                          <span>{point.venueCounts.gyms} Gyms</span>
                        </div>
                      )}
                      {point.venueCounts.amusementParks > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎡</span>
                          <span>{point.venueCounts.amusementParks} Amusement Parks</span>
                        </div>
                      )}
                      {point.venueCounts.aquariums > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🐠</span>
                          <span>{point.venueCounts.aquariums} Aquariums</span>
                        </div>
                      )}
                      {point.venueCounts.zoos > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🦁</span>
                          <span>{point.venueCounts.zoos} Zoos</span>
                        </div>
                      )}
                      {point.venueCounts.libraries > 0 && (
                        <div className="flex items-center gap-2">
                          <span>📚</span>
                          <span>{point.venueCounts.libraries} Libraries</span>
                        </div>
                      )}
                      {point.venueCounts.touristAttractions > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🗼</span>
                          <span>{point.venueCounts.touristAttractions} Attractions</span>
                        </div>
                      )}
                      {point.venueCounts.casinos > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎰</span>
                          <span>{point.venueCounts.casinos} Casinos</span>
                        </div>
                      )}
                      {point.venueCounts.performingArtsTheaters > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎭</span>
                          <span>{point.venueCounts.performingArtsTheaters} Theaters</span>
                        </div>
                      )}
                      {point.venueCounts.operaHouses > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎵</span>
                          <span>{point.venueCounts.operaHouses} Opera Houses</span>
                        </div>
                      )}
                      {point.venueCounts.concertHalls > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎼</span>
                          <span>{point.venueCounts.concertHalls} Concert Halls</span>
                        </div>
                      )}
                      {point.venueCounts.philharmonicHalls > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎻</span>
                          <span>{point.venueCounts.philharmonicHalls} Philharmonic Halls</span>
                        </div>
                      )}
                      {point.venueCounts.auditoriums > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎤</span>
                          <span>{point.venueCounts.auditoriums} Auditoriums</span>
                        </div>
                      )}
                      {point.venueCounts.comedyClubs > 0 && (
                        <div className="flex items-center gap-2">
                          <span>😂</span>
                          <span>{point.venueCounts.comedyClubs} Comedy Clubs</span>
                        </div>
                      )}
                      {point.venueCounts.danceHalls > 0 && (
                        <div className="flex items-center gap-2">
                          <span>💃</span>
                          <span>{point.venueCounts.danceHalls} Dance Halls</span>
                        </div>
                      )}
                      {point.venueCounts.amphitheatres > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🏟️</span>
                          <span>{point.venueCounts.amphitheatres} Amphitheatres</span>
                        </div>
                      )}
                      {point.venueCounts.culturalCenters > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🏛️</span>
                          <span>{point.venueCounts.culturalCenters} Cultural Centers</span>
                        </div>
                      )}
                      {point.venueCounts.culturalLandmarks > 0 && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{point.venueCounts.culturalLandmarks} Landmarks</span>
                        </div>
                      )}
                      {point.venueCounts.artStudios > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎨</span>
                          <span>{point.venueCounts.artStudios} Art Studios</span>
                        </div>
                      )}
                      {point.venueCounts.eventVenues > 0 && (
                        <div className="flex items-center gap-2">
                          <span>🎪</span>
                          <span>{point.venueCounts.eventVenues} Event Venues</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Venue List */}
                {point.venues && point.venues.length > 0 && (() => {
                  const filteredVenues = showOnlyOpenNow
                    ? point.venues.filter((v: any) => v.openNow === true)
                    : point.venues;

                  return filteredVenues.length > 0 ? (
                    <details className="mb-4">
                      <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 mb-2">
                        View {filteredVenues.length} Venues & Activities {showOnlyOpenNow && '(Open Now)'}
                      </summary>
                      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                        {filteredVenues.map((venue: any) => (
                        <div
                          key={venue.id}
                          className="bg-white border border-slate-200 rounded p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {venue.category === 'food' ? '🍴' : '🎯'}
                                </span>
                                <h5 className="font-medium text-slate-900">
                                  {venue.name}
                                </h5>
                              </div>
                              {venue.address && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {venue.address}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                {venue.rating && (
                                  <span className="text-xs text-slate-600">
                                    ⭐ {venue.rating}
                                  </span>
                                )}
                                {venue.distance && (
                                  <span className="text-xs text-slate-600 font-medium">
                                    🚶 {getWalkingTime(venue.distance)} min walk ({Math.round(venue.distance)}m)
                                  </span>
                                )}
                                <span className="text-xs text-slate-500 capitalize">
                                  {venue.type.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        ))}
                      </div>
                    </details>
                  ) : null;
                })()}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyDetails(point, index)}
                    className="flex-1 bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                  >
                    {copiedIndex === index ? '✓ Copied!' : '📋 Copy Details'}
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(point.stationName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    🗺️ Directions
                  </a>
                </div>
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

            {/* Venue Filters */}
            <div className="border-t border-slate-200 pt-4">
              {/* Open Now Toggle */}
              <div className="mb-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyOpenNow}
                    onChange={(e) => setShowOnlyOpenNow(e.target.checked)}
                    className="rounded w-4 h-4"
                  />
                  <span>🕐 Show only venues open now</span>
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                <span>Filter venue types</span>
                <span className="text-slate-400">
                  {showFilters ? "▼" : "▶"}
                </span>
              </button>

              {showFilters && (
                <div className="mt-4 space-y-4">
                  {/* Food & Drink */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2">
                      Food & Drink
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.cafes}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, cafes: e.target.checked })
                          }
                          className="rounded"
                        />
                        ☕ Cafes
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.restaurants}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, restaurants: e.target.checked })
                          }
                          className="rounded"
                        />
                        🍽️ Restaurants
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.bars}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, bars: e.target.checked })
                          }
                          className="rounded"
                        />
                        🍺 Bars
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.nightClubs}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, nightClubs: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎉 Night Clubs
                      </label>
                    </div>
                  </div>

                  {/* Entertainment */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2">
                      Entertainment
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.movieTheaters}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, movieTheaters: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎬 Cinemas
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.bowlingAlleys}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, bowlingAlleys: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎳 Bowling
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.casinos}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, casinos: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎰 Casinos
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.amusementParks}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, amusementParks: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎡 Amusement Parks
                      </label>
                    </div>
                  </div>

                  {/* Sports & Fitness */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2">
                      Sports & Fitness
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.gyms}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, gyms: e.target.checked })
                          }
                          className="rounded"
                        />
                        💪 Gyms
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.stadiums}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, stadiums: e.target.checked })
                          }
                          className="rounded"
                        />
                        🏟️ Stadiums
                      </label>
                    </div>
                  </div>

                  {/* Culture */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2">
                      Culture
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.museums}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, museums: e.target.checked })
                          }
                          className="rounded"
                        />
                        🏛️ Museums
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.artGalleries}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, artGalleries: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎨 Art Galleries
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.libraries}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, libraries: e.target.checked })
                          }
                          className="rounded"
                        />
                        📚 Libraries
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.culturalCenters}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, culturalCenters: e.target.checked })
                          }
                          className="rounded"
                        />
                        🏛️ Cultural Centers
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.culturalLandmarks}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, culturalLandmarks: e.target.checked })
                          }
                          className="rounded"
                        />
                        📍 Landmarks
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.artStudios}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, artStudios: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎨 Art Studios
                      </label>
                    </div>
                  </div>

                  {/* Performing Arts */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2">
                      Performing Arts
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.performingArtsTheaters}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, performingArtsTheaters: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎭 Theaters
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.operaHouses}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, operaHouses: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎵 Opera Houses
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.concertHalls}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, concertHalls: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎼 Concert Halls
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.philharmonicHalls}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, philharmonicHalls: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎻 Philharmonic Halls
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.auditoriums}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, auditoriums: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎤 Auditoriums
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.comedyClubs}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, comedyClubs: e.target.checked })
                          }
                          className="rounded"
                        />
                        😂 Comedy Clubs
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.danceHalls}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, danceHalls: e.target.checked })
                          }
                          className="rounded"
                        />
                        💃 Dance Halls
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.amphitheatres}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, amphitheatres: e.target.checked })
                          }
                          className="rounded"
                        />
                        🏟️ Amphitheatres
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.eventVenues}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, eventVenues: e.target.checked })
                          }
                          className="rounded"
                        />
                        🎪 Event Venues
                      </label>
                    </div>
                  </div>

                  {/* Outdoor */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2">
                      Outdoor
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.parks}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, parks: e.target.checked })
                          }
                          className="rounded"
                        />
                        🌳 Parks
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.zoos}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, zoos: e.target.checked })
                          }
                          className="rounded"
                        />
                        🦁 Zoos
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.aquariums}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, aquariums: e.target.checked })
                          }
                          className="rounded"
                        />
                        🐠 Aquariums
                      </label>
                    </div>
                  </div>

                  {/* Other */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2">
                      Other
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.shoppingMalls}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, shoppingMalls: e.target.checked })
                          }
                          className="rounded"
                        />
                        🛍️ Shopping
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={venueFilters.touristAttractions}
                          onChange={(e) =>
                            setVenueFilters({ ...venueFilters, touristAttractions: e.target.checked })
                          }
                          className="rounded"
                        />
                        🗼 Attractions
                      </label>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() =>
                        setVenueFilters({
                          cafes: true,
                          restaurants: true,
                          bars: true,
                          nightClubs: true,
                          movieTheaters: true,
                          bowlingAlleys: true,
                          museums: true,
                          artGalleries: true,
                          parks: true,
                          shoppingMalls: true,
                          casinos: true,
                          stadiums: true,
                          gyms: true,
                          amusementParks: true,
                          aquariums: true,
                          zoos: true,
                          libraries: true,
                          touristAttractions: true,
                          performingArtsTheaters: true,
                          operaHouses: true,
                          concertHalls: true,
                          philharmonicHalls: true,
                          auditoriums: true,
                          comedyClubs: true,
                          danceHalls: true,
                          amphitheatres: true,
                          culturalCenters: true,
                          culturalLandmarks: true,
                          artStudios: true,
                          eventVenues: true,
                        })
                      }
                      className="flex-1 text-xs py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setVenueFilters({
                          cafes: false,
                          restaurants: false,
                          bars: false,
                          nightClubs: false,
                          movieTheaters: false,
                          bowlingAlleys: false,
                          museums: false,
                          artGalleries: false,
                          parks: false,
                          shoppingMalls: false,
                          casinos: false,
                          stadiums: false,
                          gyms: false,
                          amusementParks: false,
                          aquariums: false,
                          zoos: false,
                          libraries: false,
                          touristAttractions: false,
                          performingArtsTheaters: false,
                          operaHouses: false,
                          concertHalls: false,
                          philharmonicHalls: false,
                          auditoriums: false,
                          comedyClubs: false,
                          danceHalls: false,
                          amphitheatres: false,
                          culturalCenters: false,
                          culturalLandmarks: false,
                          artStudios: false,
                          eventVenues: false,
                        })
                      }
                      className="flex-1 text-xs py-1 px-2 bg-slate-100 hover:bg-slate-200 rounded"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
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
