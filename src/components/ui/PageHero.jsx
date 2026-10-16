import ResponsiveImage from "./ResponsiveImage";

// Full-bleed page hero in the landing page's style: warm photo, gradient, eyebrow, display title
// with a gold italic accent. Sits under the transparent header, like the landing hero.
// `compact` is for working pages (lists, search) where the results should stay near the top of the screen.
export default function PageHero({ image, eyebrow, title, accent, children, id = "page-title", compact = false }) {
  return (
    <section aria-labelledby={id} className={`relative isolate flex items-end overflow-hidden bg-ink ${compact ? "min-h-[300px] lg:min-h-[340px]" : "min-h-[420px] lg:min-h-[480px]"}`}>
      {image && (
        <ResponsiveImage
          image={image}
          alt=""
          sizes="100vw"
          priority
          className="absolute inset-0 -z-20 size-full object-cover"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgb(10_6_3/0.55)] via-[rgb(10_6_3/0.35)] via-40% to-[rgb(10_6_3/0.8)]"
      />
      <div className={`container-site text-white ${compact ? "pb-10 pt-[calc(var(--spacing-header)+2rem)] lg:pb-12" : "pb-14 pt-[calc(var(--spacing-header)+3rem)] lg:pb-20"}`}>
        {eyebrow && <p className="font-body text-eyebrow uppercase text-gold-200">{eyebrow}</p>}
        <h1 id={id} className={`mt-4 max-w-3xl font-display font-light text-gold-50 ${compact ? "text-h2" : "text-display"}`}>
          {title}
          {accent && (
            <>
              <br />
              <em className="font-light text-gold-200">{accent}</em>
            </>
          )}
        </h1>
        {children && <p className="mt-5 max-w-xl font-body text-body-lg font-light text-white/90">{children}</p>}
      </div>
    </section>
  );
}
