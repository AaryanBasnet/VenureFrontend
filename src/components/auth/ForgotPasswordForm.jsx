import { useState } from "react";
import { Mail } from "lucide-react";
import { useForgotPassword } from "../../hooks/useForgotPasswordHook";
import AuthInput from "../ui/AuthInput";
import AuthSubmitButton from "./AuthSubmitButton";
import ResetShell, { ResetTextButton } from "./ResetShell";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Step 1: ask for the account email and send a reset code to it.
export default function ForgotPasswordForm({ defaultEmail = "", onSuccess, onClose, onBackToSignIn }) {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState("");
  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return setError("Enter your email address.");
    if (!emailPattern.test(value)) return setError("Enter a valid email address.");
    setError("");
    forgotPassword({ email: value }, { onSuccess: () => onSuccess(value) });
  };

  return (
    <ResetShell title="Reset your password" subtitle="Enter your email and we will send you a 6-digit code." onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <AuthInput
          icon={Mail}
          label="Email address"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError("");
          }}
          disabled={isPending}
          error={error}
        />
        <AuthSubmitButton pending={isPending} pendingLabel="Sending code…">
          Send reset code
        </AuthSubmitButton>
        <p className="font-body text-caption text-taupe">The code expires in 15 minutes. If it does not arrive, check your spam folder.</p>
        {(onClose || onBackToSignIn) && (
          <div className="text-center">
            <ResetTextButton onClick={onClose ?? onBackToSignIn} disabled={isPending}>
              Back to sign in
            </ResetTextButton>
          </div>
        )}
      </form>
    </ResetShell>
  );
}
