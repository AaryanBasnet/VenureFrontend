import { useId, useState } from "react";
import { Check, LockKeyhole, Circle } from "lucide-react";
import { useResetPassword } from "../../hooks/useResetPasswordHook";
import AuthInput from "../ui/AuthInput";
import AuthSubmitButton from "./AuthSubmitButton";
import ResetShell from "./ResetShell";

// Must match the backend's `strongPassword` rule in VenureBackend/validators/authValidators.js
const RULES = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p) => /\d/.test(p) },
];

// Step 3: choose the new password.
export default function ResetPasswordForm({ email, code, onSuccess, onClose }) {
  const rulesId = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [failed, setFailed] = useState("");
  const { mutate: resetPassword, isPending } = useResetPassword();

  const unmet = RULES.filter((r) => !r.test(password));
  const mismatch = confirm.length > 0 || submitted ? password !== confirm : false;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFailed("");
    if (unmet.length > 0 || password !== confirm) return;
    resetPassword(
      { email, code, password },
      {
        onSuccess: () => onSuccess?.(),
        onError: (err) => setFailed(err?.message || "We could not reset your password. The code may have expired; go back and ask for a new one."),
      }
    );
  };

  return (
    <ResetShell title="Choose a new password" subtitle={`For ${email}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <AuthInput
            icon={LockKeyhole}
            label="New password"
            type="password"
            name="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            aria-describedby={`${rulesId}`}
            error={submitted && unmet.length > 0 ? "Your password does not meet all the requirements below." : undefined}
          />
          <ul id={`${rulesId}`} className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
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
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={isPending}
          error={mismatch ? "The passwords do not match." : undefined}
        />

        {failed && (
          <p role="alert" className="font-body text-caption text-red-700">
            {failed}
          </p>
        )}

        <AuthSubmitButton pending={isPending} pendingLabel="Saving…">
          Save new password
        </AuthSubmitButton>
      </form>
    </ResetShell>
  );
}
