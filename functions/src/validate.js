// validate.js

function toFiniteNumber(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function validateLatLng(p) {
  if (!p) return false;
  const lat = toFiniteNumber(p.lat);
  const lng = toFiniteNumber(p.lng);
  if (lat === null || lng === null) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function normalizeGridPoints(input) {
  const arr = Array.isArray(input) ? input : [];
  return arr
    .map((p) => {
      const lat = toFiniteNumber(p?.lat);
      const lng = toFiniteNumber(p?.lng);
      return lat === null || lng === null ? null : { lat, lng };
    })
    .filter(Boolean);
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const t = Math.trunc(n);
  return Math.max(min, Math.min(max, t));
}

function normalizeString(v, fallback = "") {
  const s = typeof v === "string" ? v.trim() : "";
  return s || fallback;
}

function normalizeFieldMask(v, fallbackArr) {
  const s = normalizeString(v);
  return s ? s : fallbackArr.join(",");
}

function validateRequestBody(body) {
  const b = body || {};

  const gridPoints = normalizeGridPoints(b.gridPoints);
  if (!gridPoints.length) {
    return { ok: false, error: "gridPoints is required (non-empty array of {lat,lng})" };
  }

  const bad = gridPoints.find((p) => !validateLatLng(p));
  if (bad) {
    return { ok: false, error: "gridPoints contains invalid lat/lng" };
  }

  // niche = keyword
  const niche = normalizeString(b.niche);
  const keyword = normalizeString(b.keyword || b.niche);
  if (!keyword) return { ok: false, error: "keyword (or niche) is required" };

  const location = normalizeString(b.location); // "york" optional but recommended

  const radiusMeters = clampInt(b.radiusMeters, 50, 50000, 1200);
  const maxPerPoint = clampInt(b.maxPerPoint, 1, 20, 20);
  const detailsPerPlace = Boolean(b.detailsPerPlace);

  const nearbyFieldMask = normalizeFieldMask(b.nearbyFieldMask, [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.primaryType",
    "places.types",
    "places.businessStatus",
    "places.rating",
    "places.userRatingCount",
    "places.googleMapsUri",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
  ]);

  const detailsFieldMask = normalizeFieldMask(b.detailsFieldMask, [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "types",
    "primaryType",
    "businessStatus",
    "rating",
    "userRatingCount",
    "websiteUri",
    "internationalPhoneNumber",
    "nationalPhoneNumber",
    "regularOpeningHours",
    "googleMapsUri",
  ]);

  const concurrency = clampInt(b.concurrency, 1, 10, 4);

  return {
    ok: true,
    value: {
      gridPoints,
      niche,     // keep for compatibility
      keyword,   // preferred
      location,
      radiusMeters,
      maxPerPoint,
      detailsPerPlace,
      nearbyFieldMask,
      detailsFieldMask,
      concurrency,
    },
  };
}

module.exports = { validateRequestBody };
