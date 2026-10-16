import { Link } from "react-router-dom";
import Logo from "../ui/Logo";
import ResponsiveImage from "../ui/ResponsiveImage";

// The photo side of the sign-in and register pages (desktop only).
export default function AuthStoryPanel({ image, place, kicker, heading, text, priority = false }) {
  return (
    <aside className="relative isolate hidden w-[46%] max-w-[738px] flex-col justify-between overflow-hidden px-10 py-10 lg:flex xl:px-[52px] xl:py-12">
      <ResponsiveImage
        image={image}
        alt=""
        sizes="46vw"
        priority={priority}
        pictureClassName="absolute inset-0 -z-20"
        className="size-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgb(22_15_9/0.2)] from-10% via-[rgb(22_15_9/0.35)] via-50% to-[rgb(22_15_9/0.85)]" />

      <Link to="/" className="relative w-fit text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
        <Logo height={72} label="Venure home" />
      </Link>

      <div className="relative flex max-w-[550px] flex-col gap-[18px]">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-px w-[38px] bg-gold-200" />
          <span className="font-body text-caption font-medium uppercase tracking-[0.13em] text-paper-white">{place}</span>
        </div>
        <div className="flex flex-col gap-3">
          <p className="font-display text-h5 text-gold-200">{kicker}</p>
          <h2 className="font-display text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.05] tracking-[-0.03em] text-paper-white">{heading}</h2>
          <p className="max-w-[460px] font-body text-body text-paper-white/90">{text}</p>
        </div>
      </div>
    </aside>
  );
}
