// placesGridHandler.js
const { validateRequestBody } = require("./validate");
const { searchText, getPlaceDetails, asyncPool } = require("./placesClient");

function createPlacesGridHandler({ getApiKey }) {
  if (typeof getApiKey !== "function") {
    throw new Error("createPlacesGridHandler requires getApiKey() function");
  }

  return async function placesGridHandler(req, res) {
    try {
      if (req.method === "OPTIONS") return res.status(204).send("");
      if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

      const parsed = validateRequestBody(req.body || {});
      if (!parsed.ok) return res.status(400).json({ error: parsed.error });

      const apiKey = getApiKey();
      if (!apiKey) return res.status(500).json({ error: "Missing GOOGLE_PLACES_API_KEY" });

      const {
        gridPoints,
        keyword,
        niche,
        location,
        radiusMeters,
        maxPerPoint,
        detailsPerPlace,
        nearbyFieldMask,
        detailsFieldMask,
        concurrency,
      } = parsed.value;

      const kw = String(keyword || niche || "").trim();
      const loc = String(location || "").trim();
      const textQuery = loc ? `${kw} in ${loc}` : kw;

      // 1) Text search per grid point
      const perPointResults = await asyncPool(concurrency, gridPoints, async (p) => {
        const data = await searchText({
          apiKey,
          fieldMask: nearbyFieldMask,
          textQuery,
          lat: p.lat,
          lng: p.lng,
          radiusMeters,
          pageSize: maxPerPoint,
          includePureServiceAreaBusinesses: true,
        });
        return { point: p, data };
      });

      // 2) Flatten + dedupe
      const placesMap = new Map();
      for (const r of perPointResults) {
        const places = Array.isArray(r.data?.places) ? r.data.places : [];
        for (const place of places) {
          const id = place?.id;
          if (!id) continue;

          if (!placesMap.has(id)) {
            placesMap.set(id, { ...place, _matchedPoints: [r.point] });
          } else {
            placesMap.get(id)._matchedPoints.push(r.point);
          }
        }
      }

      let places = Array.from(placesMap.values());

      // 3) Optional details enrichment
      if (detailsPerPlace && places.length) {
        places = await asyncPool(concurrency, places, async (place) => {
          const details = await getPlaceDetails({
            apiKey,
            fieldMask: detailsFieldMask,
            placeId: place.id,
          });
          return { ...place, details };
        });
      }

      // ✅ Keep only businesses with website
      places = places.filter((p) => Boolean(p.websiteUri || p.details?.websiteUri));

      return res.status(200).json({
        ok: true,
        keyword: kw,
        location: loc || null,
        radiusMeters,
        count: places.length,
        places,
      });
    } catch (err) {
      console.error("placesGridHandler error:", err);
      return res.status(500).json({ error: err.message || "Internal error" });
    }
  };
}

module.exports = { createPlacesGridHandler };
