// placesClient.js
const PLACES_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const PLACES_TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_DETAILS_BASE = "https://places.googleapis.com/v1/places/";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, options, { retries = 3, baseDelayMs = 300 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      // Retry on 429 or 5xx
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : baseDelayMs * (i + 1);
        await sleep(delay);
        continue;
      }

      const text = await res.text().catch(() => "");
      throw new Error(`Places API error ${res.status}: ${text}`);
    } catch (err) {
      lastErr = err;
      await sleep(baseDelayMs * (i + 1));
    }
  }
  throw lastErr || new Error("Places API request failed");
}

function buildHeaders({ apiKey, fieldMask }) {
  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
  };
  if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask; // REQUIRED for Places API New
  return headers;
}

/**
 * Nearby Search (New)
 * ✅ locationRestriction.circle is valid here
 */
async function searchNearby({
  apiKey,
  fieldMask,
  lat,
  lng,
  radiusMeters,
  includedTypes = [],
  maxResultCount = 20,
  regionCode,
  languageCode,
} = {}) {
  const body = {
    includedTypes: Array.isArray(includedTypes) ? includedTypes : [],
    maxResultCount: typeof maxResultCount === "number" ? maxResultCount : 20,
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  };

  if (regionCode) body.regionCode = regionCode;
  if (languageCode) body.languageCode = languageCode;

  const res = await fetchWithRetry(PLACES_NEARBY_URL, {
    method: "POST",
    headers: buildHeaders({ apiKey, fieldMask }),
    body: JSON.stringify(body),
  });

  return res.json();
}

/**
 * Text Search (New)
 * ❗IMPORTANT FIX:
 * - Text Search does NOT support locationRestriction.circle
 * - Use locationBias.circle instead ✅
 */
async function searchText({
  apiKey,
  fieldMask,
  textQuery,
  lat,
  lng,
  radiusMeters,
  includedType, // ONE type only (optional)
  pageSize = 20,
  includePureServiceAreaBusinesses = true,
  strictTypeFiltering = false,
  regionCode,
  languageCode,
} = {}) {
  if (!textQuery) throw new Error("searchText requires textQuery");

  const body = {
    textQuery,
    pageSize,
    strictTypeFiltering: Boolean(strictTypeFiltering),
    includePureServiceAreaBusinesses: Boolean(includePureServiceAreaBusinesses),

    // ✅ FIX HERE
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: radiusMeters,
      },
    },
  };

  if (includedType) body.includedType = includedType;
  if (regionCode) body.regionCode = regionCode;
  if (languageCode) body.languageCode = languageCode;

  const res = await fetchWithRetry(PLACES_TEXT_URL, {
    method: "POST",
    headers: buildHeaders({ apiKey, fieldMask }),
    body: JSON.stringify(body),
  });

  return res.json();
}

async function getPlaceDetails({ apiKey, fieldMask, placeId } = {}) {
  const url = `${PLACES_DETAILS_BASE}${encodeURIComponent(placeId)}`;

  const res = await fetchWithRetry(url, {
    method: "GET",
    headers: buildHeaders({ apiKey, fieldMask }),
  });

  return res.json();
}

async function asyncPool(limit, items, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of items) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    const e = p.then(() => executing.splice(executing.indexOf(e), 1));
    executing.push(e);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

module.exports = {
  searchNearby,
  searchText,
  getPlaceDetails,
  asyncPool,
};
