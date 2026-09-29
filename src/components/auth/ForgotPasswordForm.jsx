import { useState, useEffect } from "react";
import { Mail, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useForgotPassword } from "../../hooks/useForgotPasswordHook";

export default function ForgotPasswordForm({
  defaultEmail = "",
  onSuccess,
  onClose,
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [emailError, setEmailError] = useState("");
  const { mutate: forgotPassword, isLoading } = useForgotPassword();

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (emailError && value) {
      if (validateEmail(value)) {
        setEmailError("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");

    forgotPassword(
      { email },
      {
        onSuccess: () => {
          onSuccess(email); // Pass email to parent
        },
      }
    );
  };

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
      <div className="bg-ink px-8 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-1 text-paper-white/70 transition-colors duration-200 hover:text-paper-white"
            disabled={isLoading}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 text-paper-white">
            <ShieldCheck size={22} />
            <h2 className="font-display text-xl">Reset Password</h2>
          </div>
          <div className="w-6" /> {/* Spacer for centering */}
        </div>
        <p className="mt-2 font-body text-sm text-paper-white/70">
          Enter your email address and we&rsquo;ll send you a reset code
        </p>
      </div>

      <div className="px-8 py-6">
        <div onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block font-body text-sm font-medium text-charcoal">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail
                  className={`h-5 w-5 transition-colors duration-200 ${
                    emailError ? "text-red-400" : email ? "text-gold-700" : "text-taupe-light"
                  }`}
                />
              </div>
              <input
                id="email"
                type="email"
                className={`w-full rounded-xl border-2 py-3 pl-10 pr-4 font-body transition-all duration-200 focus:outline-none focus:ring-0 ${
                  emailError
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : email
                    ? "border-gold-700/40 bg-gold-50/40 focus:border-gold-700"
                    : "border-border hover:border-border-strong focus:border-charcoal"
                } ${isLoading ? "opacity-75" : ""}`}
                placeholder="Enter your email address"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {emailError && (
              <p className="flex items-center gap-1 font-body text-sm text-red-600">
                <span className="size-1 rounded-full bg-red-600"></span>
                <span>{emailError}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-3 sm:space-y-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-border px-6 py-3 font-body font-medium text-charcoal transition-all duration-200 hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-body font-medium text-paper-white shadow-lg transition-all duration-200 hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-75 sm:w-auto"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending Code...</span>
                </>
              ) : (
                <>
                  <Mail size={16} />
                  <span>Send Reset Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-paper p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <h4 className="font-body text-sm font-medium text-charcoal">Security Note</h4>
              <p className="mt-1 font-body text-xs text-taupe">
                For your security, the reset code will expire in 15 minutes. If you don&rsquo;t receive the
                email, check your spam folder.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-ink" />
            <p className="mt-2 font-body text-sm text-taupe">Sending reset code...</p>
          </div>
        </div>
      )}
    </div>
  );
}
