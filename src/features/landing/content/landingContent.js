// Static marketing copy for the landing page (from Figma). Keep text out of components
// so it can later move to a CMS without touching the UI.

export const hero = {
  tagline: "Handpicked heritage venues across Nepal's most sacred valleys.",
  eyebrow: "Authentic spaces · Global heritage · Nepal",
};

export const venueTypesIntro = {
  eyebrow: "Venue types",
  title: "Find Your",
  accent: "Perfect Space",
  description:
    "Five distinct categories of Nepal's finest heritage venues — each with its own character and atmosphere.",
};

// `slug` is the ?category= filter value on /venues. `image`/`badge` are keys in assets/landing/images.js.
export const venueTypes = [
  { slug: "heritage-courtyards", name: "Heritage Courtyards", image: "heritageCourtyards", badge: "heritageBadge" },
  { slug: "garden-estates", name: "Garden Estates", image: "gardenEstates", badge: "gardenBadge" },
  { slug: "intimate-halls", name: "Intimate Halls", image: "intimateHalls", badge: "intimateBadge" },
  { slug: "mountain-retreats", name: "Mountain Retreats", image: "mountainRetreats", badge: "mountainBadge" },
  { slug: "rooftop-terraces", name: "Rooftop Terraces", image: "rooftopTerraces", badge: "rooftopBadge" },
];

export const storiesIntro = {
  eyebrow: "Venue Stories",
  title: "Built for the",
  accent: "Occasion",
};

// First entry renders as the large feature card, the rest as compact cards.
export const stories = [
  {
    eyebrow: "Heritage",
    title: "The Newari Courtyard",
    description:
      "Step inside a living Newari courtyard — carved wood brackets, terracotta friezes, and courtyards that have hosted celebrations for five centuries.",
    image: "storyNewariCourtyard",
    imageSizes: "(min-width: 1280px) 900px, (min-width: 1024px) 70vw, 170vw",
  },
  {
    eyebrow: "Wedding",
    title: "Traditions, Unbroken",
    description:
      "From teej-red to gold-draped mandap, our heritage venues hold space for every ritual with the reverence it deserves.",
    image: "storyWedding",
    imageSizes: "(min-width: 1024px) 269px, (min-width: 640px) 50vw, 100vw",
  },
  {
    eyebrow: "Ambience",
    title: "Candlelight & Stone",
    description:
      "Long dining tables, amber candlelight, and centuries-old stone walls — the kind of evening that guests carry home in memory.",
    image: "storyAmbience",
    imageSizes: "(min-width: 1024px) 269px, (min-width: 640px) 50vw, 100vw",
  },
];

export const seasonsIntro = {
  eyebrow: "Season Experiences",
  title: "Plan Around",
  accent: "the Season",
};

// `title`/`description` are the hover-reveal copy (Figma design-system page,
// node 143:7681 "hover"). Figma only illustrates the pattern for Summer
// ("Oasis") — Winter/Spring/Autumn copy is authored to match that voice.
export const seasons = [
  {
    name: "Summer",
    image: "seasonSummer",
    title: "Oasis",
    description:
      "June to August — lush botanical backdrops, elegant indoor banquets, and intimate celebrations sheltered during Nepal's romantic monsoon season.",
  },
  {
    name: "Winter",
    image: "seasonWinter",
    title: "Hearth",
    description:
      "December to February — crisp mountain air, candlelit interiors, and intimate gatherings warmed beside golden hearths and Himalayan views.",
  },
  {
    name: "Spring",
    image: "seasonSpring",
    title: "Bloom",
    description:
      "March to May — blossoming gardens, golden-hour ceremonies, and Nepal's most celebrated season for weddings.",
  },
  {
    name: "Autumn",
    image: "seasonAutumn",
    title: "Harvest",
    description:
      "September to November — clear Himalayan skies, festival lights, and celebrations rich with the spirit of Dashain and Tihar.",
  },
];

export const featuredIntro = {
  eyebrow: "Our Selection",
  title: "Our Finest",
  accent: "Heritage Spaces",
  description:
    "Hand-curated from across Nepal's most storied valleys — each space carries centuries of cultural memory and is dressed for your occasion.",
};

// Fallback photos for admin-curated featured venues until each one has real venueImages.
export const featuredFallbackImages = ["featuredDarbarPavilion", "featuredKumariHall", "featuredHeritageLodge"];

export const testimonialsIntro = {
  eyebrow: "Testimonials",
  title: "What guests say",
  accent: "after their event",
};


export const partnerCta = {
  eyebrow: "Partner with Venure",
  title: "List Your Venue.",
  accent: "Reach the Right Clientele.",
  description:
    "Venure connects Nepal's finest heritage spaces with clients who understand their worth. Join our curated collection.",
};
