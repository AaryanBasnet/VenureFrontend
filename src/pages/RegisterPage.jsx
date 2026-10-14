import { Link, useLocation } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import { googleSignInConfigured } from "../components/auth/googleConfig";
import GoogleDivider from "../components/auth/GoogleDivider";
import AuthStoryPanel from "../components/auth/AuthStoryPanel";
import Logo from "../components/ui/Logo";
import { images } from "../assets/landing/images";

// Figma 255:5282 "Venure register": the form on the left, the venue story on the right (mirrors sign in).
export default function RegisterPage() {
  const location = useLocation();
  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-paper">
      <div className="flex w-full max-w-[1600px]">
        <main id="main-content" className="flex flex-1 flex-col items-center justify-center-safe gap-5 overflow-y-auto bg-paper px-5 py-6 [scrollbar-gutter:stable] sm:gap-6 sm:py-8">
          <div className="flex w-full max-w-[518px] flex-col items-start gap-[18px]">
            <Link to="/" className="self-center text-charcoal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal lg:hidden">
              <Logo height={56} label="Venure home" />
            </Link>

            <div className="flex flex-col gap-2">
              <h1 className="font-display text-[30px] leading-[1.08] tracking-[-0.7px] text-charcoal sm:text-[40px]">Create your account</h1>
              <p className="font-body text-body text-taupe">Save venues, send requests and keep track of your bookings.</p>
            </div>

            {googleSignInConfigured && (
              <>
                <div className="flex w-full items-start gap-3">
                  <GoogleSignInButton />
                </div>
                <GoogleDivider />
              </>
            )}

            <RegisterForm />

            <div className="flex w-full items-center justify-between gap-4">
              <span className="font-body text-small text-taupe">Already have an account?</span>
              <Link
                to="/login"
                state={location.state}
                className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-5 font-body text-small font-medium text-charcoal hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
              >
                Sign in
              </Link>
            </div>
          </div>
        </main>

        <AuthStoryPanel
          image={images.authRegisterStory}
          place="Lake Rara, Nepal"
          kicker="The art of gathering"
          heading="Your most meaningful occasions deserve a rare setting."
          text="From private gardens to storied villas, find a venue whose character feels entirely your own."
        />
      </div>
    </div>
  );
}
