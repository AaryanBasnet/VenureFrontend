import { useEffect, useId, useRef, useState } from "react";
import { useForgotPassword } from "../../hooks/useForgotPasswordHook";
import { useVerifyResetCode } from "../../hooks/useVerifyResetCode";
import AuthSubmitButton from "./AuthSubmitButton";
import ResetShell, { ResetTextButton } from "./ResetShell";

const LENGTH = 6;
const CODE_LIFETIME = 15 * 60; // seconds; matches the backend
const RESEND_AFTER = 60; // seconds

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

// Step 2: enter the 6-digit code that was emailed.
export default function VerifyResetCodeForm({ email, onSuccess, onBack, onClose }) {
  const errorId = useId();
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(CODE_LIFETIME);
  const [sinceSent, setSinceSent] = useState(0);
  const inputs = useRef([]);
  const { mutate: verifyCode, isPending } = useVerifyResetCode();
  const { mutate: resend, isPending: resending } = useForgotPassword();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
      setSinceSent((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const focusBox = (i) => inputs.current[Math.min(LENGTH - 1, Math.max(0, i))]?.focus();

  const fill = (start, text) => {
    const chars = text.replace(/\D/g, "").slice(0, LENGTH - start).split("");
    if (chars.length === 0) return;
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, k) => {
        next[start + k] = c;
      });
      return next;
    });
    setError("");
    focusBox(start + chars.length);
  };

  const onChange = (i, e) => {
    const text = e.target.value.replace(/\D/g, "");
    if (!text) {
      setDigits((prev) => prev.map((d, k) => (k === i ? "" : d)));
      return;
    }
    fill(i, text);
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i]) focusBox(i - 1);
    else if (e.key === "ArrowLeft") focusBox(i - 1);
    else if (e.key === "ArrowRight") focusBox(i + 1);
  };

  const onPaste = (i, e) => {
    e.preventDefault();
    fill(i, e.clipboardData.getData("text"));
  };

  const code = digits.join("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.length < LENGTH) return setError("Enter all 6 digits of the code.");
    if (timeLeft === 0) return setError("This code has expired. Ask for a new one.");
    verifyCode(
      { email, code },
      {
        onSuccess: () => onSuccess(code),
        onError: () => {
          setError("That code is not right, or it has expired.");
          setDigits(Array(LENGTH).fill(""));
          focusBox(0);
        },
      }
    );
  };

  const handleResend = () => {
    resend(
      { email },
      {
        onSuccess: () => {
          setTimeLeft(CODE_LIFETIME);
          setSinceSent(0);
          setDigits(Array(LENGTH).fill(""));
          setError("");
          focusBox(0);
        },
      }
    );
  };

  const wait = Math.max(0, RESEND_AFTER - sinceSent);
  const busy = isPending || resending;

  return (
    <ResetShell title="Enter your code" subtitle={`We sent a 6-digit code to ${email}.`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <fieldset disabled={busy} className="min-w-0">
          <legend className="sr-only">6-digit reset code</legend>
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                autoFocus={i === 0}
                maxLength={LENGTH}
                value={digit}
                aria-label={`Digit ${i + 1} of ${LENGTH}`}
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? errorId : undefined}
                onChange={(e) => onChange(i, e)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onPaste={(e) => onPaste(i, e)}
                onFocus={(e) => e.target.select()}
                className={`aspect-square w-full min-w-0 rounded-xl border bg-white text-center font-body text-h5 text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal disabled:opacity-60 ${
                  error ? "border-red-700" : digit ? "border-charcoal" : "border-border-strong"
                }`}
              />
            ))}
          </div>
        </fieldset>

        {error && (
          <p id={errorId} role="alert" className="font-body text-caption text-red-700">
            {error}
          </p>
        )}

        <p className="font-body text-small text-taupe" aria-live="off">
          {timeLeft > 0 ? (
            <>
              The code expires in <span className="font-medium text-charcoal">{formatTime(timeLeft)}</span>.
            </>
          ) : (
            <span className="font-medium text-red-700">This code has expired.</span>
          )}
        </p>

        <AuthSubmitButton pending={isPending} pendingLabel="Checking code…" disabled={busy}>
          Continue
        </AuthSubmitButton>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <ResetTextButton onClick={onBack} disabled={busy}>
            Use a different email
          </ResetTextButton>
          <ResetTextButton onClick={handleResend} disabled={busy || wait > 0}>
            {resending ? "Sending…" : wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
          </ResetTextButton>
        </div>
      </form>
    </ResetShell>
  );
}
