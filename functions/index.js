const { onRequest } = require("firebase-functions/v2/https");
const cors = require("cors");
const { defineSecret } = require("firebase-functions/params");

const { createPlacesGridHandler } = require("./src/handler");

const GOOGLE_PLACES_API_KEY = defineSecret("GOOGLE_PLACES_API_KEY");

const corsHandler = cors({
  origin: ["https://softybytes.com", "https://www.softybytes.com"],
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
});

const placesGridHandler = createPlacesGridHandler({
  getApiKey: () => GOOGLE_PLACES_API_KEY.value(),
});

exports.googlePlacesFinderApi = onRequest(
  { secrets: [GOOGLE_PLACES_API_KEY], timeoutSeconds: 540, memory: "1GiB" },
  (req, res) => corsHandler(req, res, () => placesGridHandler(req, res))
);
