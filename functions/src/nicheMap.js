/**
 * Google Places (New):
 * - Nearby Search uses includedTypes (NO keyword)  :contentReference[oaicite:2]{index=2}
 * - Text Search uses textQuery (keyword) + optional includedType :contentReference[oaicite:3]{index=3}
 */

const SAFE_FALLBACK_TYPES = ["establishment"];

const ALLOWED_PLACE_TYPES = new Set([
  "accounting",
  "airport",
  "amusement_park",
  "aquarium",
  "art_gallery",
  "atm",
  "bakery",
  "bank",
  "bar",
  "beauty_salon",
  "bicycle_store",
  "book_store",
  "bowling_alley",
  "bus_station",
  "cafe",
  "campground",
  "car_dealer",
  "car_rental",
  "car_repair",
  "car_wash",
  "casino",
  "cemetery",
  "church",
  "city_hall",
  "clothing_store",
  "convenience_store",
  "courthouse",
  "dentist",
  "department_store",
  "doctor",
  "drugstore",
  "electrician",
  "electronics_store",
  "embassy",
  "establishment",
  "fire_station",
  "florist",
  "funeral_home",
  "furniture_store",
  "gas_station",
  "general_contractor",
  "gym",
  "hair_care",
  "hindu_temple",
  "home_goods_store",
  "hospital",
  "insurance_agency",
  "jewelry_store",
  "laundry",
  "lawyer",
  "library",
  "light_rail_station",
  "liquor_store",
  "local_government_office",
  "locksmith",
  "lodging",
  "meal_delivery",
  "meal_takeaway",
  "mosque",
  "movie_theater",
  "moving_company",
  "museum",
  "night_club",
  "painter",
  "park",
  "parking",
  "pet_store",
  "pharmacy",
  "physiotherapist",
  "plumber",
  "police",
  "post_office",
  "primary_school",
  "real_estate_agency",
  "restaurant",
  "roofing_contractor",
  "school",
  "secondary_school",
  "shopping_mall",
  "spa",
  "stadium",
  "store",
  "subway_station",
  "supermarket",
  "synagogue",
  "taxi_stand",
  "tourist_attraction",
  "train_station",
  "transit_station",
  "travel_agency",
  "university",
  "veterinary_care",
  "zoo",
]);

const NICHE_TO_TYPES = {
  /* HEALTHCARE */
  clinics: ["doctor", "hospital"],
  dentists: ["dentist"],
  pharmacies: ["pharmacy"],
  physiotherapists: ["physiotherapist"],
  opticians: ["establishment"],
  vets: ["veterinary_care"],
  psychologists: ["doctor", "establishment"],

  /* FOOD */
  restaurants: ["restaurant"],
  cafes: ["cafe"],
  "pizza shops": ["restaurant"],
  takeaways: ["meal_takeaway"],
  bakeries: ["bakery"],
  bars: ["bar"],
  hotels: ["lodging"],
  "guest houses": ["lodging"],
  catering: ["meal_delivery", "establishment"],

  /* BEAUTY & FITNESS */
  salons: ["beauty_salon", "hair_care"],
  barbers: ["hair_care"],
  gyms: ["gym"],
  fitness: ["gym"],
  yoga: ["gym"],
  spas: ["spa"],
  nail: ["beauty_salon"],
  makeup: ["beauty_salon"],
  personal_trainers: ["gym", "establishment"],
  "personal trainers": ["gym", "establishment"],
  pt: ["gym", "establishment"],

  /* AUTOMOTIVE */
  mechanics: ["car_repair"],
  "car repair": ["car_repair"],
  "car wash": ["car_wash"],
  mot: ["car_repair"],
  garages: ["car_repair"],
  towing: ["car_repair", "establishment"],

  /* PROPERTY */
  "real estate": ["real_estate_agency"],
  landlords: ["real_estate_agency"],
  "property management": ["real_estate_agency"],
  "estate agents": ["real_estate_agency"],
  builders: ["general_contractor"],
  plumbers: ["plumber"],
  electricians: ["electrician"],
  roofers: ["roofing_contractor"],
  painters: ["painter"],
  decorators: ["painter"],
  handyman: ["general_contractor", "establishment"],

  /* CLEANING (NO cleaning_service type exists!) */
  cleaners: ["establishment"],
  "cleaning companies": ["establishment"],
  "office cleaning": ["establishment"],
  "end of tenancy cleaning": ["establishment"],
  "deep cleaning": ["establishment"],
  "commercial cleaning": ["establishment"],
  "carpet cleaning": ["establishment"],
  "window cleaning": ["establishment"],

  /* LEGAL & FINANCE */
  "law firms": ["lawyer"],
  solicitors: ["lawyer"],
  accountants: ["accounting"],
  bookkeeping: ["accounting"],
  tax: ["accounting"],
  insurance: ["insurance_agency"],
  mortgage: ["bank", "establishment"],

  /* JOBS */
  recruitment: ["establishment"],
  staffing: ["establishment"],
  "job agencies": ["establishment"],
  "trading jobs": ["establishment"],
  hr: ["establishment"],

  /* BUSINESS & DIGITAL */
  portfolios: ["establishment"],
  freelancers: ["establishment"],
  consultants: ["establishment"],
  coaches: ["establishment"],
  agencies: ["establishment"],
  marketing: ["establishment"],
  seo: ["establishment"],
  advertising: ["establishment"],
  startups: ["establishment"],
  saas: ["establishment"],
  "software companies": ["establishment"],

  /* RETAIL */
  ecommerce: ["store"],
  online_stores: ["store"],
  shops: ["store"],
  boutiques: ["clothing_store", "store"],
  supermarkets: ["supermarket"],
  fashion: ["clothing_store"],
  electronics: ["electronics_store"],

  /* EDUCATION */
  schools: ["school"],
  colleges: ["university", "school"],
  tutors: ["school", "establishment"],
  coaching_centres: ["school", "establishment"],
  training: ["school", "establishment"],

  /* TRAVEL */
  travel: ["travel_agency"],
  tourism: ["tourist_attraction", "travel_agency"],

  /* RELIGION */
  mosques: ["mosque"],
  churches: ["church"],
  temples: ["hindu_temple"],

  /* PETS */
  pets: ["pet_store", "veterinary_care"],
  "pet shops": ["pet_store"],
  "pet store": ["pet_store"],
  petshop: ["pet_store"],
  veterinary: ["veterinary_care"],
  "animal clinic": ["veterinary_care"],
  "pet clinic": ["veterinary_care"],

  "dog grooming": ["pet_store", "establishment"],
  "pet grooming": ["pet_store", "establishment"],
  "dog walking": ["establishment"],
  "pet sitting": ["establishment"],
  "pet boarding": ["lodging", "establishment"],

  /* CHILDREN */
  children: ["school"],
  nursery: ["school"],
  nurseries: ["school"],
  "day care": ["school"],
  daycare: ["school"],
  childcare: ["school"],
  "primary school": ["primary_school", "school"],

  /* FALLBACK */
  business: ["establishment"],
  services: ["establishment"],
};

const NICHE_TO_KEYWORDS = {
  cleaners: ["cleaner", "cleaning", "end of tenancy", "office cleaning", "deep cleaning"],
  "cleaning companies": ["cleaning", "commercial cleaning", "office cleaning"],
  "carpet cleaning": ["carpet cleaning"],
  "window cleaning": ["window cleaning"],

  "dog grooming": ["dog groomer", "dog grooming"],
  "pet grooming": ["pet groomer", "pet grooming"],
  "dog walking": ["dog walker", "dog walking"],
  "pet sitting": ["pet sitter", "pet sitting"],
  "pet boarding": ["pet boarding", "kennels", "cattery"],

  recruitment: ["recruitment", "staffing", "employment agency"],
  staffing: ["staffing", "recruitment"],
  "job agencies": ["employment agency", "recruitment"],

  portfolios: ["portfolio", "personal website"],
  freelancers: ["freelancer", "consultant"],
  consultants: ["consultant"],
  coaches: ["coach", "coaching"],
};

function normalizeNiche(niche) {
  return String(niche || "").trim().toLowerCase();
}

function sanitizeTypes(types) {
  const arr = Array.isArray(types) ? types : [];
  const cleaned = arr
    .map((t) => String(t || "").trim())
    .filter((t) => ALLOWED_PLACE_TYPES.has(t));
  return cleaned.length ? cleaned : SAFE_FALLBACK_TYPES;
}

function resolveIncludedTypes({ niche, includedTypes } = {}) {
  if (Array.isArray(includedTypes) && includedTypes.length) return sanitizeTypes(includedTypes);
  const key = normalizeNiche(niche);
  return sanitizeTypes(NICHE_TO_TYPES[key]);
}

function resolveKeyword({ niche } = {}) {
  const key = normalizeNiche(niche);
  const hints = NICHE_TO_KEYWORDS[key];
  if (Array.isArray(hints) && hints.length) return hints.join(" OR ");
  // fallback: use the niche text itself as keyword if nothing mapped
  return key || "";
}

module.exports = {
  NICHE_TO_TYPES,
  NICHE_TO_KEYWORDS,
  normalizeNiche,
  sanitizeTypes,
  resolveIncludedTypes,
  resolveKeyword,
  ALLOWED_PLACE_TYPES,
};
