import { Link } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";
import GoogleSignInButton from "../components/auth/GoogleSignInButton";

// Figma 255:5283 "Register panel"
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-16 bg-paper px-5 py-16">
      <div className="flex w-full max-w-[518px] flex-col items-start gap-[18px]">
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
  );
}
