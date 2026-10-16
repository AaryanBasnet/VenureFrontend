import Logo from "../../../components/ui/Logo";
import Button from "../../../components/ui/Button";
import ResponsiveImage from "../../../components/ui/ResponsiveImage";
import { images } from "../../../assets/landing/images";
import { useLanding } from "../hooks/useLanding";

// Figma 46:3 — full-bleed courtyard photo, emblem, tagline, two CTAs
export default function HeroSection() {
  const { hero } = useLanding().content;
  return (
    <section
      aria-label="Introduction"
      className="relative isolate flex min-h-[max(640px,100svh)] items-center justify-center overflow-hidden bg-ink"
    >
      <ResponsiveImage
        image={images.hero}
        alt=""
        sizes="100vw"
        priority
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      {/* Warm gradient keeps text readable over the photo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgb(10_6_3/0.45)] via-[rgb(10_6_3/0.3)] via-40% to-[rgb(10_6_3/0.7)]"
      />

      <div className="container-site flex flex-col items-center pt-header pb-16 text-center text-white">
        <h1 className="text-gold-50">
          <Logo className="w-[min(474px,78vw)]" label="Venure" />
        </h1>

        <p className="font-display mt-6 max-w-2xl text-tagline font-light italic md:mt-8">{hero.tagline}</p>

        <p className="mt-8 max-w-md text-balance font-body text-caption font-medium uppercase tracking-[0.28em] text-white">
          {hero.eyebrow}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button to="/venues" arrow>
            Explore venues
          </Button>
          <Button variant="outline-light" to="/#stories">
            See venue stories
          </Button>
        </div>
      </div>
    </section>
  );
}
