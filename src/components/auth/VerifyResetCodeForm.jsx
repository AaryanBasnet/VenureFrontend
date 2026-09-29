import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  Loader2,
  CheckCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { useVerifyResetCode } from "../../hooks/useVerifyResetCode";

export default function VerifyResetCodeForm({
  email,
  onSuccess,
  onBack,
  onClose,
}) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const inputRefs = useRef([]);
  const { mutate: verifyCode, isLoading } = useVerifyResetCode();

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < 6; i++) {
      newCode[i] = pastedData[i] || "";
    }
    setCode(newCode);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex((digit) => digit === "");
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullCode = code.join("");

    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    verifyCode(
      { email, code: fullCode },
      {
        onSuccess: () => {
          onSuccess(fullCode);
        },
        onError: () => {
          setError("Invalid code. Please try again.");
        },
      }
    );
  };

  const handleResendCode = () => {
    setTimeLeft(300);
    setCode(["", "", "", "", "", ""]);
    setError("");
    inputRefs.current[0]?.focus();
    // Here you would typically call a resend API
  };

  const isCodeComplete = code.every((digit) => digit !== "");

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
      <div className="bg-ink px-8 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-1 text-paper-white/70 transition-colors duration-200 hover:text-paper-white"
            disabled={isLoading}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-paper-white">
            <ShieldCheck size={22} />
            <h2 className="font-display text-xl">Verify Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-paper-white/70 transition-colors duration-200 hover:text-paper-white"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-2 font-body text-sm text-paper-white/70">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      <div className="px-8 py-6">
        <div className="mb-6 text-center">
          <p className="font-body text-sm text-taupe">
            Code sent to{" "}
            <span className="rounded bg-paper px-2 py-1 font-semibold text-charcoal">{email}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  className={`h-12 w-12 rounded-xl border-2 text-center font-body text-xl font-bold transition-all duration-200 focus:outline-none focus:ring-0 ${
                    error
                      ? "border-red-300 bg-red-50 focus:border-red-500"
                      : digit
                      ? "border-gold-700 bg-gold-50 text-gold-800"
                      : "border-border hover:border-border-strong focus:border-charcoal"
                  } ${isLoading ? "opacity-75" : ""}`}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                />
              ))}
            </div>

            {error && (
              <div className="text-center">
                <p className="flex items-center justify-center gap-1 font-body text-sm text-red-600">
                  <span className="size-1 rounded-full bg-red-600"></span>
                  <span>{error}</span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3 text-center">
            {timeLeft > 0 ? (
              <p className="font-body text-sm text-taupe">
                Code expires in <span className="font-semibold text-gold-700">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="font-body text-sm font-medium text-red-600">Code has expired</p>
            )}

            <button
              type="button"
              onClick={handleResendCode}
              disabled={timeLeft > 240 || isLoading} // Disable for first minute
              className="mx-auto flex items-center gap-1 font-body text-sm font-medium text-gold-700 transition-colors duration-200 hover:text-gold-800 disabled:cursor-not-allowed disabled:text-taupe-light"
            >
              <RefreshCw size={14} />
              <span>Resend Code</span>
            </button>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:gap-3 sm:space-y-0">
            <button
              type="button"
              onClick={onBack}
              className="w-full rounded-xl border border-border px-6 py-3 font-body font-medium text-charcoal transition-all duration-200 hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              disabled={isLoading}
            >
              Back
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-6 py-3 font-body font-medium text-charcoal transition-all duration-200 hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                className="flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-body font-medium text-paper-white shadow-lg transition-all duration-200 hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-75"
                disabled={isLoading || !isCodeComplete || timeLeft === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    <span>Verify Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-paper p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <h4 className="font-body text-sm font-medium text-charcoal">Security Tip</h4>
              <p className="mt-1 font-body text-xs text-taupe">
                Never share this code with anyone. Our team will never ask for your reset code.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-ink" />
            <p className="mt-2 font-body text-sm text-taupe">Verifying code...</p>
          </div>
        </div>
      )}
    </div>
  );
}
