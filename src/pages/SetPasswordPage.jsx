import { useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Circle, LockKeyhole } from "lucide-react";
import AuthInput from "../components/ui/AuthInput";
import AuthStoryPanel from "../components/auth/AuthStoryPanel";
import AuthSubmitButton from "../components/auth/AuthSubmitButton";
import Logo from "../components/ui/Logo";
import { images } from "../assets/landing/images";
import { setupPasswordApi } from "../api/venueApplications";

// Must match the backend's `strongPassword` rule in VenureBackend/validators/authValidators.js
const RULES = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /\d/.test(p) },
];

// The page an approved venue owner reaches from the email: choose a password once, then sign in.
export default function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const rulesId = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState("");
  const [done, setDone] = useState(null); // the email to sign in with

  const unmet = RULES.filter((r) => !r.test(password));
  const mismatch = confirm.length > 0 || submitted ? password !== confirm : false;

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFailed("");
    if (unmet.length > 0 || password !== confirm || pending) return;
    setPending(true);
    try {
      const result = await setupPasswordApi(token, password);
      setDone(result.email);
    } catch (err) {
      setFailed(
        err?.response?.data?.message?.replace(/^Validation Error - /, "") ||
          (err?.response ? "We could not save your password. Please try again." : "We could not reach the server. Check your connection and try again.")
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex h-dvh justify-center overflow-hidden bg-paper">
      <div className="flex w-full max-w-[1600px]">
        <AuthStoryPanel
          image={images.authLoginStory}
          priority
          place="Welcome to Venure"
          kicker="Your venue is approved"
          heading={<>One last step before your first request.</>}
          text="Choose a password, then sign in with the email you applied with."
        />
        <main id="main-content" className="flex flex-1 flex-col items-center justify-center-safe gap-5 overflow-y-auto bg-paper px-5 py-6 [scrollbar-gutter:stable] sm:gap-6 sm:py-8">
          <div className="flex w-full max-w-[518px] flex-col items-center gap-5 sm:gap-[29px]">
            <Link to="/" className="text-charcoal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-charcoal lg:hidden">
              <Logo height={56} label="Venure home" />
            </Link>

            {done ? (
              <div className="flex w-full flex-col items-center gap-5 text-center">
                <h1 className="font-display text-[32px] leading-[1.08] tracking-[-0.8px] text-charcoal sm:text-[42px]">Your password is saved</h1>
                <p className="font-body text-body text-taupe">
                  Sign in with <strong className="font-medium text-charcoal">{done}</strong> and the password you just chose.
                </p>
                <Link to="/login" className="inline-flex min-h-12 items-center justify-center rounded-full bg-charcoal px-8 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal">
                  Go to sign in
                </Link>
              </div>
            ) : !token ? (
              <div className="flex w-full flex-col items-center gap-4 text-center">
                <h1 className="font-display text-[32px] leading-[1.08] tracking-[-0.8px] text-charcoal sm:text-[42px]">This link is incomplete</h1>
                <p className="font-body text-body text-taupe">Open the link from your approval email again. If it still does not work, write to us and we will send a new one.</p>
                <Link to="/contact" className="font-body text-button uppercase text-gold-800 underline underline-offset-4">Contact us</Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-2.5 text-center">
                  <h1 className="font-display text-[32px] leading-[1.08] tracking-[-0.8px] text-charcoal sm:text-[42px]">Choose your password</h1>
                  <p className="font-body text-body text-taupe">You will use it with your email to sign in to your owner account.</p>
                </div>
                <form onSubmit={submit} noValidate className="flex w-full flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <AuthInput
                      icon={LockKeyhole}
                      label="Password"
                      type="password"
                      name="password"
                      autoComplete="new-password"
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={pending}
                      aria-describedby={rulesId}
                      error={submitted && unmet.length > 0 ? "Your password does not meet all the requirements below." : undefined}
                    />
                    <ul id={rulesId} className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {RULES.map((r) => {
                        const ok = r.test(password);
                        return (
                          <li key={r.id} className={`flex items-center gap-2 font-body text-caption ${ok ? "text-success" : "text-taupe"}`}>
                            {ok ? <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} /> : <Circle aria-hidden="true" className="size-3.5" strokeWidth={1.5} />}
                            {r.label}
                            <span className="sr-only">{ok ? " (done)" : " (needed)"}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <AuthInput
                    icon={LockKeyhole}
                    label="Confirm password"
                    type="password"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={pending}
                    error={mismatch ? "The passwords do not match." : undefined}
                  />
                  {failed && <p role="alert" className="font-body text-caption text-red-700">{failed}</p>}
                  <AuthSubmitButton pending={pending} pendingLabel="Saving…">
                    Save my password
                  </AuthSubmitButton>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
