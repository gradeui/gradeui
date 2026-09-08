// The "@brightlocal/data" module: named datasets, one per location. The
// three captured ones are JSON files in ./data; the Harbour & Co sister
// sites are DERIVED from harbour-co (same account, same user, their own
// location block and rating) so the multi-location persona has an
// account with several locations without three more 11k JSON files.
// A dataset key is also the URL segment: /locations/<key>/...
import minusOneStudios from "./data/minus-one-studios.json";
import harbourCo from "./data/harbour-co.json";
import northsideDental from "./data/northside-dental.json";

function sister(base, location) {
  return { ...base, location: { ...base.location, ...location } };
}

export const DATASETS = {
  "minus-one-studios": minusOneStudios,
  "harbour-co": harbourCo,
  "harbour-co-hove": sister(harbourCo, {
    name: "Harbour & Co Hove",
    address: "Hove Lawns, BN3 2WN",
    phone: "01273 555 042",
    reference: "HARBOURCO-BN32WN",
    rating: { value: 4.5, count: 118 },
    photo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=60",
  }),
  "harbour-co-worthing": sister(harbourCo, {
    name: "Harbour & Co Worthing",
    address: "Worthing Pier, BN11 3PX",
    phone: "01903 555 077",
    reference: "HARBOURCO-BN113PX",
    rating: { value: 4.3, count: 64 },
    photo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=60",
  }),
  "northside-dental": northsideDental,
};
