# Fair-Meet

A London meeting point finder that calculates the fairest place for two people to meet based on journey times using the Tube and Elizabeth Line.

## What's Been Built

### ✅ Completed Features

1. **InstantDB Setup**
   - App configured with sessions schema
   - Real-time sync between users
   - Session-based shareable links

2. **Backend API Routes**
   - `/api/geocode` - Converts postcodes to coordinates
   - `/api/journey` - Calculates TfL journey times
   - `/api/venues` - Gets nearby venue counts (Google Places)
   - `/api/calculate` - Main fairness algorithm

3. **Core Libraries**
   - `lib/tfl.ts` - TfL API integration
   - `lib/geocode.ts` - Postcode geocoding
   - `lib/places.ts` - Google Places integration
   - `lib/fairness.ts` - Fairness calculation algorithm

4. **Frontend Pages**
   - Landing page with location input
   - Session page with real-time sync
   - Results display with top 3 recommendations

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Google API keys (Places & Geocoding)
- InstantDB account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
NEXT_PUBLIC_INSTANT_APP_ID=your_instant_app_id
INSTANT_APP_ADMIN_TOKEN=your_admin_token
GOOGLE_PLACES_API_KEY=your_google_api_key
GOOGLE_GEOCODING_API_KEY=your_google_api_key
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## How It Works

### User Flow

1. **User A** enters their location (postcode or station name)
2. **User A** gets a shareable link and sends it to **User B**
3. **User B** opens the link and enters their location
4. The app calculates fair meeting points based on:
   - Journey time from each person
   - Minimal time difference
   - Reasonable total journey time
5. Both users see the top 3 recommendations in real-time

### Fairness Algorithm

Based on the PRD formula:

```javascript
fairness_score = 100 - (
  (abs(time_a - time_b) / max(time_a, time_b)) * 50 +  // Time difference penalty
  (total_time / 90) * 50                                 // Total time penalty
)
```

**Constraints:**
- Discard if total time > 90 minutes
- Discard if individual time > 60 minutes
- Prefer time difference < 10 minutes

## Testing the App

### Test with Real London Postcodes

Try these example locations:

- **Canary Wharf**: E14 5AB
- **Camden**: NW1 8AB
- **Shoreditch**: EC2A 3AY
- **Clapham**: SW4 7AA
- **King's Cross**: N1 9AG

### Expected Behavior

1. Enter first location → Session created
2. Share link → Copy URL
3. Open in new tab/window → User B view
4. Enter second location → Calculation starts
5. See results → Top 3 stations displayed

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── calculate/route.ts    # Main algorithm
│   │   ├── geocode/route.ts      # Postcode to coords
│   │   ├── journey/route.ts      # TfL journey times
│   │   └── venues/route.ts       # Venue counts
│   ├── meet/[id]/page.tsx        # Session page
│   └── page.tsx                  # Landing page
├── lib/
│   ├── db.ts                     # InstantDB client
│   ├── fairness.ts               # Fairness algorithm
│   ├── geocode.ts                # Geocoding utils
│   ├── places.ts                 # Google Places client
│   └── tfl.ts                    # TfL API client
├── instant.schema.ts             # InstantDB schema
└── instant.perms.ts              # InstantDB permissions
```

## Tech Stack

- **Next.js 15** - React framework
- **InstantDB** - Real-time database
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TfL Unified API** - Journey times (free)
- **Postcode.io** - Geocoding (free)
- **Google Places API** - Venue data

## Known Limitations (MVP)

- **Tube + Elizabeth Line only** (no buses, Overground, DLR)
- **2 people maximum** (no group support)
- **Major stations only** (~20 candidates to reduce API calls)
- **Sessions expire after 24 hours**
- **No venue data yet** (can be enabled with `includeVenues: true`)

## Troubleshooting

### "Could not geocode location"
- Ensure postcode is valid UK format (e.g., E14 5AB)
- Check Google Geocoding API key is set
- Try using a full postcode with space

### "Could not find nearest stations"
- Location may be outside London
- TfL API may be down
- Check network connection

### "Failed to calculate meeting points"
- TfL API rate limit may be exceeded
- Check API keys are configured
- Ensure both locations are in London

## API Rate Limits

- **TfL Unified API**: 500 requests/min (free)
- **Google Places**: 28,000 requests/month (free tier)
- **Postcode.io**: Unlimited (free)

---

**Built with ❤️ for London commuters**
