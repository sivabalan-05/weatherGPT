# Weather Déjà Vu — Historical Analog Engine

**Date:** 2026-09-05
**Status:** Approved for implementation

## Purpose

Every weather product answers *"what will happen?"* WeatherGPT will also answer
*"when this place last looked exactly like this, what came next?"*

Analog forecasting — finding historical days whose atmospheric state resembles
the present and studying what followed — is an established meteorological
technique that is essentially never surfaced to end users. Exposing it turns an
abstract forecast into empirical precedent: instead of "60% chance of rain,"
the user sees "the eight closest matches in 40 years of this location's real
record; six of them were raining within 72 hours."

This is a good fit for WeatherGPT's existing audience. The agriculture module
already serves users making irrigation and harvest decisions, and "what usually
follows a day like this" is the question that framing implies.

## Grounding Constraint

`CLAUDE.md` states that all numeric weather facts must originate from
Open-Meteo and never be invented. This feature is built entirely on the
Open-Meteo Historical Archive API. No LLM participates in producing any number;
the verdict sentence is template-generated from computed values, matching the
`_grounded_deterministic_synthesis` pattern already used in `ai_assistant.py`.

### Pre-existing violation corrected in this work

`climate_service.py` currently generates its entire output from `math.sin()`
curves and labels it *"Historical climate patterns for {location}"*. The
Climate tab therefore displays fabricated data. This work rewires that module
onto the real archive layer introduced here. The module's JSON response shape
is preserved so `ClimateView.tsx` requires no change.

## Architecture

Five units, each independently testable:

| Unit | Responsibility | Depends on |
|---|---|---|
| `archive_service.py` | Fetch + cache 40y daily record for a location | Open-Meteo Archive API |
| `analog_engine.py` | Match today against history, summarize outcomes | `archive_service` |
| `climate_service.py` | Real monthly normals + departures (rewritten) | `archive_service` |
| `routers/analog.py` | HTTP surface, param validation, error mapping | `analog_engine` |
| `AnalogView.tsx` | Presentation | `client.ts` |

Data flow:

```
live forecast (today's 6-feature fingerprint)
        +
archive_service (≈14,600 historical days)
        ↓
analog_engine: seasonal gate → normalize → weighted k-NN → outcome window
        ↓
routers/analog.py  →  client.ts  →  AnalogView.tsx
```

## §1 Archive Layer

New file `backend/app/services/archive_service.py`.

Fetches daily records from `settings.ARCHIVE_URL` — already defined in
`core/config.py` and currently unused — from 1985-01-01 to present.

Variables requested (all verified available on the archive endpoint):
`temperature_2m_max`, `temperature_2m_min`, `temperature_2m_mean`,
`precipitation_sum`, `wind_speed_10m_max`, `relative_humidity_2m_mean`,
`surface_pressure_mean`, `weather_code`.

**Caching.** In-memory LRU, 32 entries, 24-hour TTL, keyed on coordinates
rounded to 0.1°. Rationale: 0.1° ≈ 11 km, which approximates Open-Meteo's own
grid resolution, so finer keys would waste cache slots on identical upstream
data. The archive updates daily with a ~5-day publication lag, so a 24-hour TTL
never serves meaningfully stale data. Measured cost of a miss: 482 KB, ~3.2 s.

**Cleaning.** Days with a null in any required field are dropped at load time,
so downstream code may assume complete rows.

## §2 Analog Engine

New file `backend/app/services/analog_engine.py`.

### Step 1 — Seasonal gate

Candidates are historical days falling within ±10 days of today's day-of-year,
across all archive years. Day-of-year distance is **circular**, so 31 December
and 2 January are 2 days apart, not 364.

This gate is load-bearing. Without it a warm January day could match an August
monsoon day on raw temperature and humidity, and the resulting "what came next"
would describe monsoon dynamics that cannot occur in January. The gate
constrains matches to the same seasonal regime. It yields ≈21 × 40 = 840
candidates, which is ample for a stable 8-nearest-neighbour result.

### Step 2 — Fingerprint

Six features per day: `tmax`, `tmin`, `precipitation_sum`,
`relative_humidity_2m_mean`, `surface_pressure_mean`, `wind_speed_10m_max`.

`precipitation_sum` is transformed with `log1p` before normalization. It is
zero-inflated and long-tailed; raw z-scoring would let a single 200 mm day
dominate the distance metric and crowd out every other dimension.

Today's fingerprint is built from the **live forecast** API (the archive lags
~5 days). The same six variables are read from both sources so the vectors are
commensurable.

### Step 3 — Distance

Each feature is z-scored **across the candidate pool** — not the full archive —
so that the scale is set by seasonally comparable days. Distance is weighted
Euclidean, weights ordered by consequence to a user:

| Feature | Weight |
|---|---|
| precipitation | 2.0 |
| tmax, tmin | 1.5 each |
| humidity, pressure | 1.0 each |
| wind | 0.5 |

### Step 4 — Similarity score

`similarity = 100 · exp(−d / d_ref)` where `d_ref` is the median candidate
distance. This anchors the percentage to "close relative to a typical day at
this location and season."

The UI must label this as a **relative similarity measure, not a probability.**
It expresses how alike two days were, not the likelihood of any outcome.

### Step 5 — Outcome window

For each of the top 8 analogs, read days +1…+7 from the archive. Analogs whose
window would extend past the end of the archive are discarded before ranking,
never truncated — a partial window would silently bias aggregate statistics
downward.

### Step 6 — Aggregate

Across surviving analogs: share with ≥1 mm precipitation within 72 hours; mean
7-day precipitation total; mean tmax change by day 3; and a
template-generated verdict sentence selected from computed values only.

## §3 Climate Rewire

`climate_service.py` is rewritten to aggregate real archive data: monthly mean
tmax/tmin and monthly precipitation totals per year.

"Normal" becomes the **1991–2020 WMO standard reference period** rather than an
invented baseline, so departure percentages carry their conventional
meteorological meaning. The response shape is unchanged.

## §4 API

New `backend/app/routers/analog.py`, mounted in `main.py` and added to the root
endpoint listing.

`GET /api/analog?lat={float}&lon={float}&name={str}`

Follows the established thin-router pattern: `ValueError` → 400,
`RuntimeError` → 502, unexpected → 500.

## §5 Frontend

- `components/analog/AnalogView.tsx` — new view.
- `NavTab` gains `'analog'`; `Navigation.tsx` gains an entry with a `History`
  icon (lucide-react, already a dependency).
- `client.ts` gains `getWeatherAnalogs()`.
- `types/weather.ts` gains interfaces mirroring the response.
- `i18n/translations.ts` gains tokens in all four languages (en, hi, te, ta).
  Per repo convention no UI string is inlined.

`client.ts` deliberately gets **no direct-to-Open-Meteo fallback** for this
endpoint. The fallback pattern exists to keep the app usable when the backend
is down, but the analog computation *is* the feature; reimplementing it in
TypeScript would duplicate the algorithm and contradict the repo's own warning
about keeping duplicated logic in sync. On backend failure the view shows an
explanatory empty state.

## Error Handling

| Condition | Behavior |
|---|---|
| Location outside archive coverage | 502 with explanatory message; view shows empty state, not a blank chart |
| Fewer than 3 usable analogs after filtering | 502 with insufficient-data message |
| Archive fetch timeout | 502 inviting a retry; cache untouched so a retry can still succeed |
| Upstream rate limit (429) | 502 naming rate limiting specifically, so the user knows to wait rather than assume the location is unsupported |
| Invalid lat/lon | 400 from router validation |

**Correction from implementation.** The design assumed open ocean and polar
coordinates fell outside archive coverage. That is wrong: the ERA5 reanalysis
behind the archive is global. (0, 0) returns a complete 41-year record, and so
does the South Pole. What actually goes wrong at remote coordinates is *latency*
— (-89, 0) exceeded the 45s client timeout on a cold fetch and then succeeded on
retry. The error text was corrected to match, so a timeout now invites a retry
instead of claiming the location is unsupported.

## Testing

The repository has no test framework and this work does not introduce one.
Verification is by direct endpoint probe:

1. **Hyderabad (17.38, 78.48)** — monsoon regime; confirm seasonal gate keeps
   analogs inside the correct season and outcomes are plausible.
2. **London (51.51, -0.13)** — temperate regime; confirms the engine is not
   tuned to one climate.
3. **Ocean point (0, 0)** and **Antarctic point (-89, 0)** — both return full
   records, confirming coverage really is global. The Antarctic point timed out
   on its first cold fetch and succeeded on retry, which is what exercised the
   timeout path.
4. **Climate tab** — confirm it renders unchanged after the rewire, and that
   its numbers now differ from the old sine-curve output.
5. **Cache** — confirm second request for the same location is served without
   an upstream fetch.

## Out of Scope

- No test framework introduction.
- No change to `ai_assistant.py`; wiring analogs into the chat assistant is a
  plausible follow-up but is not part of this work.
- No persistent cache. In-memory is sufficient at current scale; a restart
  simply re-warms.
