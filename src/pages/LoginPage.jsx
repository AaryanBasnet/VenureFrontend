import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import { googleSignInConfigured } from "../components/auth/googleConfig";
import GoogleDivider from "../components/auth/GoogleDivider";
import AuthDialog from "../components/auth/AuthDialog";
import AuthStoryPanel from "../components/auth/AuthStoryPanel";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import VerifyResetCodeForm from "../components/auth/VerifyResetCodeForm";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";
import Logo from "../components/ui/Logo";
import { images } from "../assets/landing/images";

// Figma 255:5358 "Venure login": story panel on the left, the form on the right.
export default function LoginPage() {
  const location = useLocation();
  const [step, setStep] = useState("login"); // 'login' | 'forgot' | 'verify' | 'reset'
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const closeDialog = () => {
    setStep("login");
    setEmail("");
    setCode("");
  };

  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-paper">
      <div className="flex w-full max-w-[1600px]">
        <AuthStoryPanel
          image={images.authLoginStory}
          priority
          place="Patan, Nepal"
          kicker="A place becomes a memory"
          heading={<>Extraordinary settings for life&rsquo;s finest moments.</>}
          text="Discover singular venues selected for their architecture, atmosphere, and unmistakable sense of place."
        />

        {/* Form panel */}
        <main id="main-content" className="flex flex-1 flex-col items-center justify-center-safe gap-5 overflow-y-auto bg-paper px-5 py-6 [scrollbar-gutter:stable] sm:gap-6 sm:py-8">
          <div className="flex w-full max-w-[518px] flex-col items-center gap-5 sm:gap-[29px]">
            <Link to="/" className="text-charcoal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal lg:hidden">
              <Logo height={56} label="Venure home" />
            </Link>

            <div className="flex flex-col items-center gap-2.5 text-center">
              <h1 className="font-display text-[32px] leading-[1.08] tracking-[-0.8px] text-charcoal sm:text-[42px]">Welcome back</h1>
              <p className="font-body text-body text-taupe">Sign in to see your saved venues, requests and bookings.</p>
            </div>

            {googleSignInConfigured && (
              <>
                <div className="flex w-full items-start gap-3">
                  <GoogleSignInButton />
                </div>
                <GoogleDivider />
              </>
            )}

            <LoginForm onForgotPassword={() => setStep("forgot")} />

            <div className="flex w-full items-center justify-between gap-4">
              <span className="font-body text-small text-taupe">New to Venure?</span>
              <Link
                to="/register"
                state={location.state}
                className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-5 font-body text-small font-medium text-charcoal hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
              >
                Create an account
              </Link>
            </div>
          </div>
        </main>
      </div>

      {step !== "login" && (
        <AuthDialog onClose={closeDialog}>
          {step === "forgot" && (
            <ForgotPasswordForm
              defaultEmail={email}
              onSuccess={(userEmail) => {
                setEmail(userEmail);
                setStep("verify");
              }}
              onClose={closeDialog}
            />
          )}
          {step === "verify" && (
            <VerifyResetCodeForm
              email={email}
              onSuccess={(resetCode) => {
                setCode(resetCode);
                setStep("reset");
              }}
              onBack={() => setStep("forgot")}
              onClose={closeDialog}
            />
          )}
          {step === "reset" && <ResetPasswordForm email={email} code={code} onSuccess={closeDialog} onClose={closeDialog} />}
        </AuthDialog>
      )}
    </div>
  );
}
