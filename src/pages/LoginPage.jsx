import { useState } from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import VerifyResetCodeForm from "../components/auth/VerifyResetCodeForm";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";
import Logo from "../components/ui/Logo";
import ResponsiveImage from "../components/ui/ResponsiveImage";
import { images } from "../assets/landing/images";

// Figma 255:5358 "Venure login" — full split-panel page (not just the isolated
// "Login panel" component, which is only the right-hand form half).
export default function LoginPage() {
  const [step, setStep] = useState("login"); // 'login' | 'forgot' | 'verify' | 'reset'
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const handleCloseModal = () => {
    setStep("login");
    setEmail("");
    setCode("");
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-[#e7dfd2]">
      {/* Venue story panel */}
      <div className="relative isolate hidden w-[46%] max-w-[738px] flex-col justify-between overflow-hidden px-10 py-10 lg:flex xl:px-[52px] xl:py-12">
        <ResponsiveImage
          image={images.authLoginStory}
          alt=""
          sizes="46vw"
          priority
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
              Patan · Nepal
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-display text-[20px] leading-[1.2] text-gold-icon">A place becomes a memory</p>
            <h2 className="font-display text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.05] tracking-[-0.03em] text-paper-white">
              Extraordinary settings for life&rsquo;s finest moments.
            </h2>
            <p className="max-w-[460px] font-body text-[15px] leading-[1.55] text-paper-white/85">
              Discover singular venues selected for their architecture, atmosphere, and unmistakable sense of place.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center gap-5 overflow-y-auto bg-paper px-5 py-6 sm:gap-8 sm:py-10">
        <div className="flex w-full max-w-[518px] flex-col items-center gap-5 sm:gap-[29px]">
          <Link to="/" className="lg:hidden">
            <Logo height={56} label="Venure home" className="text-charcoal" />
          </Link>

          <div className="flex flex-col items-center gap-2.5 text-center">
            <h1 className="font-display text-[32px] leading-[1.08] tracking-[-0.8px] text-charcoal sm:text-[42px]">
              Welcome back
            </h1>
            <p className="font-body text-[15px] leading-[1.5] text-taupe">
              Sign in to revisit saved venues, enquiries, and private recommendations.
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

          <LoginForm onForgotPassword={() => setStep("forgot")} />

          <div className="flex w-full items-center justify-between">
            <span className="font-body text-[13px] text-taupe">Don&rsquo;t have an account?</span>
            <Link
              to="/register"
              className="rounded-full border border-border-strong px-4 py-2.5 font-body text-[12px] font-medium text-charcoal hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
            >
              Register
            </Link>
          </div>
        </div>

        <div className="flex w-full max-w-[1000px] items-center justify-between text-taupe-light">
          <p className="font-body text-[12px] font-light">© {new Date().getFullYear()} Venure</p>
          <p className="font-body text-[11px]">Privacy · Terms · Help</p>
        </div>
      </div>

      {step !== "login" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          {step === "forgot" && (
            <ForgotPasswordForm
              defaultEmail={email}
              onSuccess={(userEmail) => {
                setEmail(userEmail);
                setStep("verify");
              }}
              onClose={handleCloseModal}
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
              onClose={handleCloseModal}
            />
          )}
          {step === "reset" && (
            <ResetPasswordForm
              email={email}
              code={code}
              onSuccess={() => setStep("login")}
              onClose={handleCloseModal}
            />
          )}
        </div>
      )}
    </div>
  );
}
