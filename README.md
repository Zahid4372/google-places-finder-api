# Google Places Finder API

**Service URL**  
https://googleplacesfinderapi-rzblhes7la-uc.a.run.app

A **keyword-based business finder API** built on **Google Places API (New)**.  
Designed for **lead generation**, especially for finding businesses **that have real websites**.

---

## What this API does

- Searches Google Places using **Text Search (New)**
- Uses your keyword (sent as `niche`) + optional location text
- Searches across multiple grid points to cover an entire area
- Deduplicates results by `place.id`
- Returns **only businesses that have a real website**
- Optionally enriches results with Place Details

Typical use case:
> “Find all *cleaners with websites* in *York*”

---

## Endpoint

### `POST /`

---

## Request format

### Required fields

| Field | Type | Description |
|-----|------|-------------|
| `gridPoints` | array | List of `{ lat, lng }` points |
| `niche` | string | Keyword to search (e.g. `"cleaners"`) |

---

### Optional fields

| Field | Type | Default | Description |
|-----|------|---------|-------------|
| `location` | string | — | Human-readable location text (e.g. `"york"`) |
| `radiusMeters` | number | `1200` | Search radius per grid point |
| `maxPerPoint` | number | `20` | Max results per grid point |
| `detailsPerPlace` | boolean | `false` | Fetch Place Details |
| `concurrency` | number | `4` | Parallel requests limit |

---

## Example request

```json
{
  "gridPoints": [
    { "lat": 53.9599, "lng": -1.0873 },
    { "lat": 53.9699, "lng": -1.0773 },
    { "lat": 53.9499, "lng": -1.0973 }
  ],
  "niche": "cleaners",
  "location": "york",
  "radiusMeters": 1200,
  "maxPerPoint": 20,
  "detailsPerPlace": false,
  "concurrency": 4
}


---

## Example response

```json
{
  "ok": true,
  "keyword": "cleaners",
  "location": "york",
  "radiusMeters": 1200,
  "count": 12,
  "places": [
    {
      "id": "ChIJ...",
      "displayName": { "text": "Example Cleaners" },
      "formattedAddress": "York, UK",
      "location": { "latitude": 53.96, "longitude": -1.08 },
      "primaryType": "establishment",
      "websiteUri": "https://examplecleaners.co.uk",
      "_matchedPoints": [
        { "lat": 53.9599, "lng": -1.0873 }
      ]
    }
  ]
}

