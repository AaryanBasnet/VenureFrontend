import { Link } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import Logo from "../components/ui/Logo";
import ResponsiveImage from "../components/ui/ResponsiveImage";
import { images } from "../assets/landing/images";

// Figma 255:5282 "Venure register" — full split-panel page (form on the left,
// venue story on the right; mirrored from the login page).
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-[#e7dfd2]">
      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-16 bg-paper px-5 py-16">
        <div className="flex w-full max-w-[518px] flex-col items-start gap-[18px]">
          <Link to="/" className="self-center lg:hidden">
            <Logo height={56} label="Venure home" className="text-charcoal" />
          </Link>

          <div className="flex flex-col gap-2">
            <h1 className="font-display text-[40px] leading-[1.08] tracking-[-0.7px] text-charcoal">
              Begin your next chapter
            </h1>
            <p className="font-body text-[15px] leading-[1.45] text-taupe">
              Create your profile to save exceptional venues and receive considered recommendations.
            </p>
          </div>

          <div className="flex w-full items-start gap-3">
            <GoogleSignInButton />
          </div>

          <div className="flex w-full items-center gap-3.5">
            <div className="h-px flex-1 bg-border" />
            <span className="font-body text-[11px] uppercase tracking-[0.11em] text-taupe-light">
              or with email
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <RegisterForm />

          <div className="flex w-full items-center justify-between">
            <span className="font-body text-[13px] text-taupe">Already a member?</span>
            <Link
              to="/login"
              className="rounded-full border border-border-strong px-4 py-2.5 font-body text-[12px] font-medium text-charcoal hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="flex w-full max-w-[1000px] items-center justify-between text-taupe-light">
          <p className="font-body text-[12px] font-light">© {new Date().getFullYear()} Venure</p>
          <p className="font-body text-[11px]">Privacy · Terms · Help</p>
        </div>
      </div>

      {/* Venue story panel */}
      <div className="relative isolate hidden w-[46%] max-w-[738px] flex-col justify-between overflow-hidden px-10 py-10 lg:flex xl:px-[52px] xl:py-12">
        <ResponsiveImage
          image={images.authRegisterStory}
          alt=""
          sizes="46vw"
          className="absolute inset-0 -z-20 size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgb(22_15_9/0.13)] from-10% to-[rgb(22_15_9/0.72)]"
        />

        <Link to="/" className="relative w-fit text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <Logo height={72} label="Venure home" />
        </Link>

        <div className="relative flex max-w-[550px] flex-col gap-[18px]">
          <div className="flex items-center gap-2.5">
            <span aria-hidden="true" className="h-px w-[38px] bg-gold-icon" />
            <span className="font-body text-[12px] font-medium uppercase tracking-[0.13em] text-paper-white">
              Lake Rara · Nepal
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-display text-[20px] leading-[1.2] text-gold-icon">The art of gathering</p>
            <h2 className="font-display text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.05] tracking-[-0.03em] text-paper-white">
              Your most meaningful occasions deserve a rare setting.
            </h2>
            <p className="max-w-[460px] font-body text-[15px] leading-[1.55] text-paper-white/85">
              From private gardens to storied villas, find a venue whose character feels entirely your own.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
