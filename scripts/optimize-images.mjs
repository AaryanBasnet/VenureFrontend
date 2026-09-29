/**
 * Optimizes the landing-page master images into responsive, web-ready assets.
 *
 *   npm run images:optimize                    # masters in ../venure (default)
 *   npm run images:optimize -- --src <folder>  # masters elsewhere
 *
 * Masters (full-quality originals) stay OUTSIDE the repo. This script writes
 * resized AVIF/WebP/PNG files to src/assets/landing/ plus a generated
 * src/assets/landing/images.js manifest that components import.
 * Re-running is deterministic: same inputs, same outputs.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "src/assets/landing");

const argSrc = process.argv.indexOf("--src");
const SRC_DIR = path.resolve(ROOT, argSrc > -1 ? process.argv[argSrc + 1] : "../venure");

const QUALITY = {
  avif: { quality: 50, effort: 6 },
  webp: { quality: 74, effort: 6 },
  png: { compressionLevel: 9, palette: true, quality: 90 },
};

// Widths are ~2x the largest rendered size (retina) plus smaller steps for mobile.
// Widths larger than the master are skipped (never upscale).
const PHOTO = ["avif", "webp"];
const PHOTO_WIDTHS = [480, 800, 1200, 1600];

/** key -> { src (relative to masters), dir, widths, formats } */
const IMAGES = {
  // Brand logo is a vector: src/assets/brand/venure-emblem.svg (not generated here)

  // Hero (full-bleed)
  hero: { src: "hero section bg.jpg", dir: "hero", name: "hero-courtyard", widths: [768, 1280, 1920, 2560], formats: PHOTO },

  // Venue types: tall crops from landscape photos need extra width for height
  heritageCourtyards: { src: "venue types/hertiage courtyard.png", dir: "venue-types", name: "heritage-courtyards", widths: [600, 1000, 1400], formats: PHOTO },
  gardenEstates: { src: "venue types/garden.png", dir: "venue-types", name: "garden-estates", widths: [600, 1000, 1400], formats: PHOTO },
  intimateHalls: { src: "venue types/intimate hall.png", dir: "venue-types", name: "intimate-halls", widths: [600, 1000, 1400], formats: PHOTO },
  mountainRetreats: { src: "venue types/mounatin.png", dir: "venue-types", name: "mountain-retreats", widths: [600, 1000, 1400], formats: PHOTO },
  rooftopTerraces: { src: "venue types/roof.png", dir: "venue-types", name: "rooftop-terraces", widths: [600, 1000, 1400], formats: PHOTO },

  // Venue type badges (rendered at 32px)
  heritageBadge: { src: "venue types/hertaige logo.png", dir: "venue-types", name: "heritage-badge", widths: [96], formats: ["webp"] },
  gardenBadge: { src: "venue types/garden logo.png", dir: "venue-types", name: "garden-badge", widths: [96], formats: ["webp"] },
  intimateBadge: { src: "venue types/intimate logo.png", dir: "venue-types", name: "intimate-badge", widths: [96], formats: ["webp"] },
  mountainBadge: { src: "venue types/mountain logo.png", dir: "venue-types", name: "mountain-badge", widths: [96], formats: ["webp"] },
  rooftopBadge: { src: "venue types/roof logo.png", dir: "venue-types", name: "rooftop-badge", widths: [96], formats: ["webp"] },

  // Venue stories
  storyNewariCourtyard: { src: "venue stories/venue stories big card.png", dir: "stories", name: "newari-courtyard", widths: PHOTO_WIDTHS, formats: PHOTO },
  storyWedding: { src: "venue stories/wedding image.png", dir: "stories", name: "wedding", widths: [480, 800, 1200], formats: PHOTO },
  storyAmbience: { src: "venue stories/amdience.jpg", dir: "stories", name: "ambience", widths: [480, 800, 1200], formats: PHOTO },

  // Seasons (very tall crops)
  seasonSummer: { src: "season experiences/summer.png", dir: "seasons", name: "summer", widths: [640, 1100, 1600], formats: PHOTO },
  seasonWinter: { src: "season experiences/winter.png", dir: "seasons", name: "winter", widths: [640, 1100, 1600], formats: PHOTO },
  seasonSpring: { src: "season experiences/spring.png", dir: "seasons", name: "spring", widths: [640, 1100, 1600], formats: PHOTO },
  seasonAutumn: { src: "season experiences/autum.png", dir: "seasons", name: "autumn", widths: [640, 1100, 1600], formats: PHOTO },

  // Featured venues
  featuredDarbarPavilion: { src: "Featured Venues/the darbar pavillion.png", dir: "featured", name: "darbar-pavilion", widths: [640, 1000, 1570], formats: PHOTO },
  featuredKumariHall: { src: "Featured Venues/kumari hertaige hall.png", dir: "featured", name: "kumari-heritage-hall", widths: [640, 1000, 1570], formats: PHOTO },
  featuredHeritageLodge: { src: "Featured Venues/heritage lodge.png", dir: "featured", name: "heritage-lodge", widths: [640, 1000, 1570], formats: PHOTO },

  // Testimonials
  testimonialPriyaAditya: { src: "Testimonials/priya and aditya.png", dir: "testimonials", name: "priya-aditya", widths: [640, 1000, 1448], formats: PHOTO },
  testimonialAnita: { src: "Testimonials/anita.png", dir: "testimonials", name: "anita", widths: [640, 1000, 1448], formats: PHOTO },
  testimonialRohanSunita: { src: "Testimonials/rohan and sunita.png", dir: "testimonials", name: "rohan-sunita", widths: [640, 1000, 1448], formats: PHOTO },

  // Auth pages: full-height "venue story" photo beside the login/register form
  authLoginStory: { src: "auth/login-story.jpg", dir: "auth", name: "login-story", widths: PHOTO_WIDTHS, formats: PHOTO },
  authRegisterStory: { src: "auth/register-story.jpg", dir: "auth", name: "register-story", widths: PHOTO_WIDTHS, formats: PHOTO },
};

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function processImage(key, config) {
  const input = path.join(SRC_DIR, config.src);
  const meta = await sharp(input).metadata();

  // Never upscale; if every requested width is too big, use the master width once
  let widths = config.widths.filter((w) => w <= meta.width);
  if (widths.length === 0 || Math.max(...config.widths) > meta.width) {
    widths = [...new Set([...widths, meta.width])];
  }
  widths.sort((a, b) => a - b);

  await fs.mkdir(path.join(OUT_DIR, config.dir), { recursive: true });

  const outputs = []; // { format, width, file, bytes }
  for (const width of widths) {
    for (const format of config.formats) {
      const file = `${config.dir}/${config.name}-${width}.${format}`;
      const info = await sharp(input)
        .rotate() // respect EXIF orientation
        .resize({ width, withoutEnlargement: true })
        .toFormat(format, QUALITY[format])
        .toFile(path.join(OUT_DIR, file));
      outputs.push({ format, width, file, bytes: info.size });
    }
  }

  return {
    key,
    width: meta.width,
    height: meta.height,
    formats: config.formats,
    outputs,
    masterBytes: (await fs.stat(input)).size,
  };
}

function buildManifest(results) {
  const imports = [];
  const entries = [];
  let n = 0;

  for (const r of results) {
    const byFormat = {};
    for (const o of r.outputs) {
      const id = `i${n++}`;
      imports.push(`import ${id} from "./${o.file}";`);
      (byFormat[o.format] ||= []).push(`\${${id}} ${o.width}w`);
    }
    // Fallback: the largest file of the last listed format (webp / png)
    const fallbackFormat = r.formats[r.formats.length - 1];
    const fallback = byFormat[fallbackFormat].at(-1).split(" ")[0];

    const sources = r.formats
      .filter((f) => f !== fallbackFormat)
      .map((f) => `      { type: "image/${f}", srcSet: \`${byFormat[f].join(", ")}\` },`)
      .join("\n");

    entries.push(`  ${r.key}: {
    width: ${r.width},
    height: ${r.height},
    src: \`${fallback}\`,
    srcSet: \`${byFormat[fallbackFormat].join(", ")}\`,
    sources: [
${sources}
    ],
  },`);
  }

  return `// AUTO-GENERATED by scripts/optimize-images.mjs — do not edit by hand.
// Re-run \`npm run images:optimize\` after changing the master images.
${imports.join("\n")}

/**
 * Responsive image descriptors. Use with <ResponsiveImage image={images.hero} sizes="100vw" />.
 * width/height are the master's intrinsic size (for aspect ratio / CLS).
 */
export const images = {
${entries.join("\n")}
};
`;
}

async function main() {
  await fs.access(SRC_DIR).catch(() => {
    throw new Error(`Master image folder not found: ${SRC_DIR} (pass --src <folder>)`);
  });

  // Clean previous output so renamed/removed images don't linger
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const results = [];
  for (const [key, config] of Object.entries(IMAGES)) {
    const r = await processImage(key, config);
    results.push(r);
    const largest = r.outputs.filter((o) => o.format !== "avif").at(-1);
    console.log(`${key.padEnd(24)} ${kb(r.masterBytes).padStart(8)} -> ${kb(largest.bytes).padStart(7)} (largest ${largest.format})`);
  }

  await fs.writeFile(path.join(OUT_DIR, "images.js"), buildManifest(results));

  const masterTotal = results.reduce((s, r) => s + r.masterBytes, 0);
  const outTotal = results.flatMap((r) => r.outputs).reduce((s, o) => s + o.bytes, 0);
  console.log(`\nMasters: ${(masterTotal / 1048576).toFixed(1)} MB -> all generated files: ${(outTotal / 1048576).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
