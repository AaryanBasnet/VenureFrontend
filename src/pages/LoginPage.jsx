import { useState } from "react";
import { Link } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import VerifyResetCodeForm from "../components/auth/VerifyResetCodeForm";
import ResetPasswordForm from "../components/auth/ResetPasswordForm";

// Figma 255:5370 "Login panel"
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-16 bg-paper px-5 py-16">
      <div className="flex w-full max-w-[518px] flex-col items-center gap-[29px]">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <h1 className="font-display text-[42px] leading-[1.08] tracking-[-0.8px] text-charcoal">
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
