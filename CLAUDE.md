# Fair-Meet MVP PRD
**London Fair Meeting Point Finder**

**Version:** 1.0 MVP
**Target Launch:** 2-3 months
**Stack:** Next.js + InstantDB + TfL API
**Team:** Solo developer

---

## 1. Executive Summary

Fair-Meet helps two people in London find the fairest place to meet by calculating journey times and suggesting midpoint stations with good venue options.

**Core Value Prop:** Stop the "where should we meet?" back-and-forth. Get a fair answer in 10 seconds.

---

## 2. Problem Statement

**User Pain Points** (validated through research):
- Manually comparing routes on Google Maps is tedious
- Hard to know if a meeting point is truly fair
- Many "geographically middle" locations have poor venue options
- Current solutions (WhatsHalfway, MeetWays) don't account for London's transport topology

**Why This Matters:**
- Londoners make ~3-5 meetup plans per week
- 40% of these involve negotiating location
- Bad locations lead to canceled plans or frustration

---

## 3. MVP Scope (2-3 Months)

### **What's IN the MVP**

#### Core Features
1. **2-Person Journey Calculation**
   - Input: 2 postcodes or station names
   - Transport modes: Tube + Elizabeth Line only
   - Output: Top 3 fairest midpoint stations

2. **Fairness Algorithm**
   - Calculate journey time from each person to candidate stations
   - Rank by: (a) minimal time difference, (b) reasonable total time

3. **Venue Density Overlay**
   - Show number of cafes/pubs within 400m of each suggested station
   - Data source: Google Places API (Basic tier)
   - Simple filters: Coffee shops, Pubs, Restaurants

4. **Interactive Map**
   - Show both users' starting points
   - Display top 3 recommended stations
   - Show travel time for each person
   - Click station to see venue list

5. **Shareable Links**
   - User A creates session → gets shareable link
   - User B clicks link → adds their location
   - Both see results in real-time (InstantDB sync)

6. **Simple Directions**
   - "Get Directions" button → deeplink to Google Maps/Citymapper

### **What's OUT of MVP** (Future versions)

- ❌ 3+ people (just 2-person for now)
- ❌ Vibe-based filtering (too complex for v1)
- ❌ Activity types (bowling, cinema, etc.)
- ❌ Bus, Overground, DLR (just Tube + Liz Line)
- ❌ Real-time disruption alerts
- ❌ User accounts / saved preferences
- ❌ In-app reservations
- ❌ Mobile native apps (web-first, mobile-responsive)

### **Why This Scope?**

As a solo dev, this MVP is:
- **Technically achievable** in 2-3 months
- **Testable** with real users quickly
- **Valuable** enough to validate the concept
- **Expandable** with clear v2 features

---

## 4. User Profiles & Use Cases

### Primary Personas

**Persona 1: "After-Work Anya"**
- Age: 28, works in Canary Wharf
- Meeting friend who lives in Camden
- Needs: Quick decision, somewhere open till 8pm, not too pricey
- Quote: *"I just want to know it's fair and has decent pubs"*

**Persona 2: "First Date Dan"**
- Age: 32, lives in Clapham
- Meeting Hinge match from Shoreditch
- Needs: Neutral territory, nice vibe, not presumptuous
- Quote: *"I don't want to suggest my area and seem pushy"*

**Persona 3: "Freelance Fiona"**
- Age: 25, works from home in Brixton
- Meeting client from King's Cross
- Needs: Professional setting, quiet cafe, good wifi
- Quote: *"I need somewhere we can actually work, not just drink"*

### Core User Journey

```
User A opens app
  ↓
Enters "E14 5AB" (their postcode)
  ↓
Clicks "Share with friend"
  ↓
Sends link via WhatsApp
  ↓
User B opens link
  ↓
Enters "N1 9AG" (their postcode)
  ↓
[Algorithm runs: <5 seconds]
  ↓
Both see: "Meet at King's Cross St Pancras"
         "Dan: 18 min | Anya: 22 min | Difference: 4 min"
         "🎯 92/100 fair"
         "☕ 45 cafes, 🍺 23 pubs nearby"
  ↓
Click "Show Venues" → List of nearby options
  ↓
Click "Get Directions" → Opens in Google Maps
```

---

## 5. Success Criteria

### Primary Metrics (Track from Day 1)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Time to Result** | <10 seconds | Core UX promise |
| **Recommendation Acceptance** | >50% pick a top-3 suggestion | Validates algorithm quality |
| **Shared Link Conversion** | >30% of links opened result in location input | Viral growth indicator |
| **Week-1 Retention** | >25% return within 7 days | Product stickiness |

### Secondary Metrics

- Venue click-through rate (>40% of users explore venues)
- Average session duration (target: 2-3 minutes)
- Mobile vs desktop usage split
- Most common origin-destination pairs (for optimization)

### Success Signals (Qualitative)

- Users share the link organically with friends
- Positive feedback on "fairness" of suggestions
- Requests for specific features (tells us what to build next)

---

## 6. Detailed Feature Specifications

### 6.1 Journey Time Calculation

**Algorithm Flow:**

```
1. Input: postcode_a, postcode_b
2. Geocode to lat/lon (Postcode.io API - free)
3. Find nearest Tube/Liz Line station for each user
4. Query TfL API for all stations within "reasonable range"
   - Reasonable range = max 45 min from either person
5. For each candidate station:
   - Calculate journey time from User A
   - Calculate journey time from User B
   - Calculate fairness_score
6. Rank and return top 3
```

**Fairness Score Formula:**

```javascript
fairness_score = 100 - (
  (abs(time_a - time_b) / max(time_a, time_b)) * 50 +  // Time difference penalty
  (total_time / 90) * 50                                 // Total time penalty
)

// Constraints:
// - Discard if total_time > 90 minutes
// - Discard if max individual time > 60 minutes
// - Prefer difference < 10 minutes
```

**Example:**

| Station | Time A | Time B | Diff | Total | Fairness Score |
|---------|--------|--------|------|-------|----------------|
| Liverpool St | 15 min | 18 min | 3 min | 33 min | **92** |
| Oxford Circus | 22 min | 12 min | 10 min | 34 min | **75** |
| King's Cross | 18 min | 20 min | 2 min | 38 min | **90** |

**Data Sources:**

- **TfL Unified API** (Journey Planner endpoint)
  - Rate limit: 500 req/min (free tier)
  - Need to register for API key
  - Cache results for 1 hour (journey times are stable)

- **Postcode.io** (Geocoding)
  - Free, no auth required
  - Fallback: Google Geocoding API

**Caching Strategy:**

```
Cache key: "journey:{from_station}:{to_station}:{time_bucket}"
Time bucket: Round to nearest 15 minutes
TTL: 1 hour
Storage: InstantDB or Redis (if needed for performance)
```

### 6.2 Venue Discovery

**Data Source:** Google Places API (Basic tier - free 28k requests/month)

**Query per Station:**

```javascript
// For each recommended station:
const nearby_cafes = await places.search({
  location: station_coords,
  radius: 400,  // 400m = ~5 min walk
  type: 'cafe',
  openNow: true
});

const nearby_pubs = await places.search({
  location: station_coords,
  radius: 400,
  type: 'bar',
  openNow: true
});

const nearby_restaurants = await places.search({
  location: station_coords,
  radius: 400,
  type: 'restaurant',
  openNow: true
});
```

**Venue Scoring (Simple v1):**

```javascript
venue_score = (
  cafe_count * 2 +      // Weight cafes higher
  pub_count * 1.5 +
  restaurant_count * 1
) / 10

// Final station score:
final_score = fairness_score * 0.7 + venue_score * 0.3
```

**Display:**

- "23 cafes, 15 pubs, 31 restaurants within 5 min walk"
- Click to expand: List of top 5 venues with ratings
- Link to Google Maps for each venue

### 6.3 Shareable Links (InstantDB)

**Schema:**

```javascript
// InstantDB schema
const schema = {
  sessions: {
    id: String,
    created_at: Date,
    user_a_location: String,
    user_b_location: String,
    status: String,  // 'waiting_for_b' | 'calculating' | 'complete'
    results: Object,
  }
};
```

**Flow:**

1. User A enters location → create session in InstantDB
2. Generate shareable link: `fair-meet.app/meet/abc123`
3. User B opens link → reads session, adds their location
4. InstantDB real-time sync → both see results immediately
5. Session expires after 24 hours

**Implementation:**

```javascript
// User A creates session
const { id } = await db.sessions.insert({
  user_a_location: 'E14 5AB',
  status: 'waiting_for_b'
});

// User B joins
await db.sessions.update(id, {
  user_b_location: 'N1 9AG',
  status: 'calculating'
});

// Both subscribe to changes
db.sessions.subscribe(id, (session) => {
  if (session.status === 'complete') {
    showResults(session.results);
  }
});
```

### 6.4 Map Interface

**Technology:** Mapbox GL JS (free tier: 50k loads/month)

**Map Layers:**

1. **Origin Points:** Blue pin (User A), Green pin (User B)
2. **Recommended Stations:** Gold pins (sized by rank)
3. **Journey Paths:** Dashed lines from each origin to station
4. **Venue Heatmap:** Light overlay showing cafe/pub density

**Interactions:**

- Click station → Popup with travel times + venue count
- Click venue marker → Show name, rating, "Get Directions"
- Zoom to fit all points on load

**Mobile Optimization:**

- Bottom sheet UI for results (not sidebar)
- Swipeable cards for station recommendations
- One-tap to copy address or open in Maps

---

## 7. Technical Architecture

### 7.1 Stack

**Frontend:**
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** for styling
- **Mapbox GL JS** for maps
- **Shadcn/ui** for components (optional, speeds up UI dev)

**Backend/Database:**
- **InstantDB** (real-time sync, no backend needed for CRUD)
- **Next.js API Routes** (for TfL + Places API calls)
- **Edge Functions** (if deploying to Vercel)

**External APIs:**
- TfL Unified API
- Google Places API
- Postcode.io

**Hosting:**
- **Vercel** (free tier is fine for MVP)

### 7.2 Data Flow

```
User Input (PostCode)
     ↓
API Route: /api/geocode
     ↓
Postcode.io → Lat/Lon
     ↓
API Route: /api/calculate-midpoint
     ↓
TfL API (cached) → Journey Times
     ↓
Fairness Algorithm → Top 3 Stations
     ↓
Google Places API → Venue Counts
     ↓
Return Results → InstantDB Session
     ↓
Real-time Sync → Both Users' Browsers
     ↓
Mapbox Renders Results
```

### 7.3 File Structure

```
/app
  /page.tsx                 # Landing page
  /meet/[id]/page.tsx       # Shared session page
  /api
    /geocode/route.ts       # Postcode → Lat/Lon
    /journey/route.ts       # TfL journey calculation
    /venues/route.ts        # Google Places lookup
    /calculate/route.ts     # Main midpoint algorithm
/lib
  /tfl.ts                   # TfL API client
  /places.ts                # Google Places client
  /fairness.ts              # Fairness algorithm
  /instant.ts               # InstantDB config
/components
  /Map.tsx                  # Mapbox component
  /LocationInput.tsx        # Autocomplete input
  /ResultsCard.tsx          # Station recommendation card
  /VenueList.tsx            # Nearby venues
  /ShareLink.tsx            # Copy link button
```

### 7.4 Performance Optimizations

**Caching:**
```javascript
// Cache TfL journey results
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getJourney(from, to) {
  const key = `${from}-${to}-${getTimeBucket()}`;
  if (cache.has(key)) return cache.get(key);

  const result = await tflAPI.journey(from, to);
  cache.set(key, result);
  setTimeout(() => cache.delete(key), CACHE_TTL);
  return result;
}
```

**API Call Optimization:**
- Batch Places API calls (3 types per station = 3 requests, not 9)
- Pre-compute venue counts for popular stations (background job)
- Use InstantDB for session state (no polling needed)

**Lazy Loading:**
- Map loads on interaction (not on page load)
- Venue details fetched on demand (when user clicks station)

---

## 8. User Interface Design

### 8.1 Core Screens

**Screen 1: Landing Page**
```
┌────────────────────────────────────┐
│   Fair-Meet                    [?] │
│                                    │
│   Find the fairest place to meet  │
│   in London                        │
│                                    │
│   ┌────────────────────────────┐  │
│   │ Your location              │  │
│   │ [Enter postcode/station]   │  │
│   └────────────────────────────┘  │
│                                    │
│   [ Start New Meetup ]             │
│   [ Join Existing (Paste Link) ]  │
│                                    │
│   How it works:                    │
│   1. Add your location             │
│   2. Share link with friend        │
│   3. See fair meeting points       │
└────────────────────────────────────┘
```

**Screen 2: Waiting for Friend**
```
┌────────────────────────────────────┐
│  ← Back                            │
│                                    │
│  Your location: Canary Wharf       │
│                                    │
│  Share this link with your friend: │
│  ┌────────────────────────────┐   │
│  │ fair-meet.app/meet/abc123  │   │
│  │               [Copy Link]  │   │
│  └────────────────────────────┘   │
│                                    │
│  Waiting for them to add their    │
│  location...                       │
│                                    │
│  [QR Code]                         │
└────────────────────────────────────┘
```

**Screen 3: Results (Desktop)**
```
┌─────────────────────────────────────────────────────┐
│  Fair-Meet              [Share] [Start New]         │
├──────────────────┬──────────────────────────────────┤
│                  │  [MAP VIEW - 60% width]          │
│  Top Picks:      │                                  │
│                  │  📍 Blue Pin (User A)            │
│  ⭐ King's Cross │  📍 Green Pin (User B)           │
│  You: 18 min     │  ⭐ Gold Pins (Recommendations)  │
│  Them: 20 min    │                                  │
│  Diff: 2 min     │  Journey paths shown             │
│  🎯 92/100 fair  │                                  │
│  ☕ 45 cafes     │                                  │
│  🍺 23 pubs      │                                  │
│  [Show Venues]   │                                  │
│  [Directions]    │                                  │
│                  │                                  │
│  2. Liverpool St │                                  │
│  You: 15 min     │                                  │
│  Them: 18 min    │                                  │
│  ...             │                                  │
│                  │                                  │
│  3. Oxford Circ  │                                  │
│  ...             │                                  │
└──────────────────┴──────────────────────────────────┘
```

**Screen 4: Venue List (Modal/Sheet)**
```
┌────────────────────────────────────┐
│  Cafes near King's Cross       [×] │
│                                    │
│  ☕ Caravan                         │
│  ⭐⭐⭐⭐ 4.3 · ££ · 2 min walk      │
│  [Directions]                      │
│                                    │
│  ☕ Dishoom                         │
│  ⭐⭐⭐⭐⭐ 4.6 · ££ · 4 min walk     │
│  [Directions]                      │
│                                    │
│  ☕ The Lighterman                 │
│  ⭐⭐⭐⭐ 4.2 · ££ · 3 min walk      │
│  [Directions]                      │
│                                    │
│  [Show Pubs Instead]               │
└────────────────────────────────────┘
```

### 8.2 Mobile Adaptations

- Bottom sheet for results (not sidebar)
- Full-screen map with floating result cards
- Swipeable carousel for station recommendations
- Sticky "Share" and "Directions" buttons

---

## 9. MVP Feature Prioritization (MoSCoW)

### **MUST Have** (Cannot launch without)
- ✅ 2-person journey calculation
- ✅ Tube + Elizabeth Line only
- ✅ Top 3 station recommendations
- ✅ Travel time display
- ✅ Shareable link with real-time sync
- ✅ Basic map with pins
- ✅ Venue count overlay (just numbers)

### **SHOULD Have** (Important but not blocking)
- ⚠️ Venue list with names/ratings (can show counts only for v1)
- ⚠️ Station autocomplete (can use raw postcode input)
- ⚠️ "Get Directions" deeplink
- ⚠️ Mobile-responsive design

### **COULD Have** (Nice to have)
- 💡 Venue type filter (cafe vs pub)
- 💡 Time of day selector
- 💡 Save recent searches (localStorage)
- 💡 Analytics tracking

### **WON'T Have** (Explicitly v2+)
- ❌ 3+ people
- ❌ Other transport modes
- ❌ Vibe filtering
- ❌ User accounts
- ❌ Activity types

---

## 10. Competitive Analysis

### Existing Solutions

**WhatsHalfway.com**
- ❌ Purely geographic midpoint (ignores transport)
- ❌ Not London-specific
- ✅ Simple UI
- **Our advantage:** Transport-aware fairness

**MeetWays**
- ❌ US-focused, poor UK coverage
- ❌ Driving-only
- **Our advantage:** Public transport, London-native

**Google Maps "Search Along Route"**
- ❌ Requires manually creating route first
- ❌ No fairness calculation
- ✅ Best venue data
- **Our advantage:** Automated fairness, purpose-built UX

**TfL Journey Planner**
- ❌ Point-to-point only, no midpoint finder
- ✅ Authoritative transport data
- **Our advantage:** Midpoint calculation + venue layer

### Unique Value Proposition

**Fair-Meet is the ONLY tool that:**
1. Uses London's actual transport topology (not geographic midpoint)
2. Calculates fairness based on journey time
3. Overlays venue quality/density
4. Works for public transport users
5. Has shareable collaborative sessions

---

## 11. Technical Feasibility & Risks

### API Dependencies

| API | Cost | Rate Limit | Risk | Mitigation |
|-----|------|------------|------|------------|
| TfL Unified | Free | 500 req/min | API downtime | Cache aggressively, fallback messaging |
| Google Places | $0 (28k/mo free) | 28k requests/month | Quota exceeded | Only fetch on user click, cache venue data |
| Postcode.io | Free | Unlimited | Service down | Fallback to Google Geocoding |
| Mapbox | Free (50k loads) | 50k map loads/month | Quota exceeded | Lazy load map, track usage |

### Technical Risks

**Risk 1: TfL API Performance**
- *Problem:* Journey Planner can be slow (2-5 sec per query)
- *Impact:* Total calculation time >10 sec (fails UX goal)
- *Mitigation:*
  - Pre-compute popular routes
  - Cache for 1 hour
  - Show loading states
  - Run queries in parallel

**Risk 2: InstantDB Schema Changes**
- *Problem:* Early-stage product, breaking changes possible
- *Impact:* App breaks on schema change
- *Mitigation:*
  - Pin to specific version
  - Simple schema (easy to migrate)
  - Keep sessions temporary (24h expiry)

**Risk 3: Venue Data Quality**
- *Problem:* Google Places may have stale/wrong data
- *Impact:* Users arrive to find closed venues
- *Mitigation:*
  - Show "Open Now" filter
  - Link to Google Maps (users can verify)
  - v2: Add user reports

**Risk 4: Solo Dev Capacity**
- *Problem:* 2-3 months is tight for one person
- *Impact:* Launch delay or cut features
- *Mitigation:*
  - Follow MoSCoW prioritization strictly
  - Ship ugly-but-functional first
  - Get user feedback early (week 4-5)

### Performance Constraints

**Target Benchmarks:**
- Time to first paint: <1.5s
- Time to interactive: <3s
- Calculation time: <10s (includes API calls)
- Map load time: <2s

**Load Testing Plan:**
- Test with 100 concurrent sessions
- Verify cache hit rate >70%
- Monitor API quota usage

---

## 12. Data & Privacy

### Data Collection

**What we store:**
- Session data (postcodes, results) - 24 hour retention
- Anonymous usage analytics (session count, calculation time)
- No personal data, no accounts

**What we DON'T store:**
- User names, emails
- Precise GPS coordinates (only postcode-level)
- Session history beyond 24 hours

### GDPR Compliance

- Cookie banner (analytics cookies only)
- Privacy policy page
- Data deletion after 24 hours (automatic)
- No third-party tracking (except Google Analytics - optional)

### Security

- HTTPS only
- No auth system (no passwords to leak)
- InstantDB handles data encryption
- Rate limiting on API routes (prevent abuse)

---

## 13. Go-to-Market Strategy

### Launch Plan (Week 12)

**Week 1-2: Friends & Family**
- Share with 20 close contacts
- Gather qualitative feedback
- Fix critical bugs

**Week 3-4: Targeted Reddit/Discord**
- r/london, r/LondonSocialClub
- Focus on "meeting strangers" use case (dating, new friends)

**Week 5-8: Product Hunt Launch**
- Prepare assets (screenshots, demo video)
- Target "Productivity" or "Social" category
- Goal: Top 10 daily ranking

**Week 9-12: Organic Growth**
- SEO optimization ("london meeting point finder")
- Word-of-mouth via shareable links
- Monitor analytics, iterate

### Distribution Channels

1. **Shareable links** (viral loop built-in)
2. **Reddit** (r/london gets 500k monthly users)
3. **Dating app communities** (Hinge, Bumble subreddits)
4. **London Facebook groups**
5. **SEO** (long-tail: "fair meeting point calculator london")

### Early Adopter Profile

- Active Londoners (20-40 age range)
- Tech-savvy (comfortable with web apps)
- Frequently meet new people (dating, networking, social)
- Pain-aware (currently manually calculate midpoints)

---

## 14. Monetization Strategy

### MVP: FREE (No monetization)

**Rationale:** Focus on product-market fit first. Need 1000+ active users before monetizing.

### Future Monetization Options (v2+)

**Option 1: Freemium**
- Free: 2-person, basic features
- Premium (£3/month or £20/year):
  - 3-5 person groups
  - Saved preferences/history
  - Vibe filters
  - Priority support

**Option 2: Affiliate Revenue**
- Partner with venues for "Featured" listings
- Commission from booking platforms (OpenTable, etc.)
- Estimated: £0.50-2 per conversion

**Option 3: API Access**
- Sell midpoint calculation API to other apps
- £100-500/month for startups

**Initial Target:** Break even on hosting costs (Vercel + APIs = ~£20/month)

---

## 15. Success Metrics & Validation Plan

### Week 4 Checkpoint (Alpha Launch)

**Must achieve:**
- 50 unique sessions created
- <10 second average calculation time
- <3 critical bugs reported
- Positive feedback from 5+ testers

**If not achieved:** Re-evaluate core algorithm or UX flow

### Week 8 Checkpoint (Beta Launch)

**Must achieve:**
- 200 unique sessions
- 30% shared link conversion rate
- 20% week-1 retention
- 10+ organic shares on social media

**If not achieved:** Revisit problem-solution fit

### Week 12 Checkpoint (Public Launch)

**Must achieve:**
- 1000 unique sessions
- 50+ daily active users
- >4.0 average user rating (if we add feedback)
- Featured in 1+ tech publication

**If achieved:** Start planning v2 features

---

## 16. Development Roadmap

### Phase 1: Foundation (Weeks 1-3)

**Week 1: Setup**
- [ ] Initialize Next.js project
- [ ] Set up InstantDB schema
- [ ] Get API keys (TfL, Google Places, Mapbox)
- [ ] Create basic UI shell
- [ ] Deploy to Vercel staging

**Week 2: Core Algorithm**
- [ ] Build TfL API client
- [ ] Implement fairness calculation
- [ ] Test with 10 real London postcode pairs
- [ ] Optimize for <10s calculation time

**Week 3: Venue Layer**
- [ ] Integrate Google Places API
- [ ] Build venue scoring logic
- [ ] Create caching layer
- [ ] Test venue data quality

### Phase 2: UX (Weeks 4-6)

**Week 4: Map Interface**
- [ ] Integrate Mapbox
- [ ] Display origin points + recommendations
- [ ] Add journey path lines
- [ ] Mobile responsive layout

**Week 5: Shareable Links**
- [ ] Implement session creation/joining
- [ ] Real-time sync with InstantDB
- [ ] Copy link + QR code functionality
- [ ] Test with 5 friend pairs

**Week 6: Polish & Refinement**
- [ ] Add loading states
- [ ] Error handling (invalid postcode, API timeout)
- [ ] Improve mobile UX
- [ ] Performance optimization

### Phase 3: Launch Prep (Weeks 7-9)

**Week 7: Alpha Testing**
- [ ] Friends & family testing (20 people)
- [ ] Bug fixes
- [ ] Analytics integration
- [ ] Privacy policy + legal pages

**Week 8: Beta Testing**
- [ ] Expand to 50 testers
- [ ] Gather feedback via form
- [ ] Iterate on top 3 pain points
- [ ] Prepare marketing assets

**Week 9: Public Launch**
- [ ] SEO optimization
- [ ] Product Hunt submission
- [ ] Reddit/social media posts
- [ ] Monitor for issues

### Phase 4: Iterate (Weeks 10-12)

**Week 10-12: Post-Launch**
- [ ] Fix critical bugs
- [ ] Add most-requested feature
- [ ] Optimize based on analytics
- [ ] Plan v2 features

---

## 17. Open Questions & Decisions Needed

### Need to Decide Before Starting

1. **Exact UI framework?**
   - Option A: Shadcn/ui (faster, pre-built components)
   - Option B: Custom Tailwind (more control, lighter bundle)
   - **Recommendation:** Shadcn for speed

2. **Map provider?**
   - Option A: Mapbox (better custom styling)
   - Option B: Google Maps (easier integration with Places)
   - **Recommendation:** Mapbox (free tier is generous)

3. **Handle users outside London?**
   - Option A: Show error message "London only"
   - Option B: Expand to calculate anyway (national rail)
   - **Recommendation:** Error for MVP, expand in v2

4. **Default venue filter?**
   - Option A: Show all (cafes + pubs + restaurants)
   - Option B: Ask user to pick
   - **Recommendation:** Show all, add filter in week 6 if time

### Open Research Questions

- What's the average journey time for Londoners meeting up? (Hypothesis: 20-30 min)
- Do users prefer 3 options or 5? (A/B test in week 8)
- Is "fairness score" meaningful to users or confusing? (User test in week 5)

---

## 18. Dependencies & Assumptions

### Assumptions

1. TfL API will remain free and stable
2. Users trust entering their postcode (privacy acceptable)
3. 2-person is valuable enough to validate concept
4. Tube-only is acceptable (most common London transport)
5. Users will share links organically

### External Dependencies

- TfL Unified API uptime (>95%)
- Google Places data quality
- InstantDB service stability
- Vercel hosting reliability

### Internal Dependencies

- Solo dev availability (~20 hours/week)
- No major life disruptions
- Learning curve for InstantDB (<1 week)

---

## 19. Risk Mitigation Summary

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TfL API slow | High | Medium | Aggressive caching, parallel requests |
| Scope creep | High | High | Strict MoSCoW, weekly scope review |
| Low user interest | Medium | High | Early testing (week 4), pivot if needed |
| Technical blocker | Medium | Medium | Timebox research (2 days max), ask for help |
| API quota exceeded | Low | Medium | Monitor usage, add rate limiting |
| Solo dev burnout | Medium | High | Realistic timeline, cut features not quality |

---

## 20. Next Steps (Week 0)

### Immediate Actions (This Week)

1. **Set up development environment**
   - [ ] Create Next.js project
   - [ ] Sign up for InstantDB
   - [ ] Get TfL API key
   - [ ] Get Google Places API key

2. **Validate technical feasibility**
   - [ ] Make test call to TfL API (journey time)
   - [ ] Make test call to Google Places (venue search)
   - [ ] Verify InstantDB real-time sync works

3. **Create project plan**
   - [ ] Set up GitHub repo
   - [ ] Create week-by-week task breakdown
   - [ ] Set up basic analytics (PostHog or Simple Analytics)

4. **Design validation**
   - [ ] Sketch wireframes for 3 core screens
   - [ ] Get feedback from 2-3 potential users
   - [ ] Finalize UI approach

### Decision Points

By end of Week 1, confirm:
- ✅ All APIs are accessible and functional
- ✅ InstantDB can handle real-time session sync
- ✅ Calculation can be done in <10 seconds
- ✅ Basic UI makes sense to test users

**If any are ❌, reassess technical approach before proceeding.**

---

## Appendix A: API Documentation Links

- **TfL Unified API:** https://api.tfl.gov.uk
- **Google Places API:** https://developers.google.com/maps/documentation/places
- **Postcode.io:** https://postcodes.io
- **InstantDB Docs:** https://instantdb.com/docs
- **Mapbox GL JS:** https://docs.mapbox.com/mapbox-gl-js

## Appendix B: Sample API Responses

*(Include real example responses from TfL, Places, etc. for reference)*

## Appendix C: User Research Summary

*(If you have interview notes, add them here)*

---

**Document Status:** MVP Scope Finalized
**Last Updated:** 2025-11-27
**Next Review:** After Week 4 Alpha Launch
