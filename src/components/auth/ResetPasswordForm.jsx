import { useState } from "react";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { useResetPassword } from "../../hooks/useResetPasswordHook";

// Must match the backend's `strongPassword` rule in
// VenureBackend/validators/authValidators.js
const validatePassword = (password) => {
  const errors = {};

  if (password.length < 8) {
    errors.length = "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    errors.uppercase = "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    errors.lowercase = "Password must contain at least one lowercase letter";
  }
  if (!/\d/.test(password)) {
    errors.number = "Password must contain at least one number";
  }

  return errors;
};

const getPasswordStrength = (password) => {
  const validationErrors = validatePassword(password);
  const errorCount = Object.keys(validationErrors).length;

  if (password.length === 0) return { strength: 0, label: "" };
  if (errorCount >= 3) return { strength: 1, label: "Weak", color: "bg-red-500" };
  if (errorCount >= 2) return { strength: 2, label: "Fair", color: "bg-orange-500" };
  if (errorCount >= 1) return { strength: 3, label: "Good", color: "bg-gold" };
  return { strength: 4, label: "Strong", color: "bg-success" };
};

export default function ResetPasswordForm({ email, code, onSuccess, onClose }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { mutate: resetPassword, isLoading } = useResetPassword();

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword) {
      const validationErrors = validatePassword(newPassword);
      setErrors((prev) => ({ ...prev, password: validationErrors }));
    } else {
      setErrors((prev) => ({ ...prev, password: {} }));
    }

    // Clear confirm password error if passwords now match
    if (confirmPassword && newPassword === confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: null }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);

    if (newConfirmPassword && password !== newConfirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const passwordErrors = validatePassword(password);
    let hasErrors = false;

    if (Object.keys(passwordErrors).length > 0) {
      setErrors((prev) => ({ ...prev, password: passwordErrors }));
      hasErrors = true;
    }

    if (password !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      hasErrors = true;
    }

    if (hasErrors) return;

    resetPassword(
      { email, code, password },
      {
        onSuccess: () => {
          onSuccess();
        },
        onError: () => {
          setErrors({ general: "Failed to reset password. Please try again." });
        },
      }
    );
  };

  const passwordStrength = getPasswordStrength(password);
  const isFormValid =
    password &&
    confirmPassword &&
    Object.keys(errors.password || {}).length === 0 &&
    !errors.confirmPassword;

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
      <div className="bg-ink px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-paper-white">
            <LockKeyhole size={22} />
            <h2 className="font-display text-xl">Set New Password</h2>
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
          Create a strong password for your account
        </p>
      </div>

      <div className="px-8 py-6">
        <div className="mb-6 text-center">
          <p className="font-body text-sm text-taupe">
            Resetting password for{" "}
            <span className="rounded bg-paper px-2 py-1 font-semibold text-charcoal">{email}</span>
          </p>
        </div>

        <div className="space-y-6">
          {errors.general && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
              <AlertCircle size={16} />
              <span className="font-body text-sm">{errors.general}</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="block font-body text-sm font-medium text-charcoal">
              New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LockKeyhole className="h-5 w-5 text-taupe-light" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`w-full rounded-xl border-2 py-3 pl-10 pr-12 font-body transition-all duration-200 focus:outline-none focus:ring-0 ${
                  errors.password && Object.keys(errors.password).length > 0
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : password
                    ? "border-gold-700/40 bg-gold-50/40 focus:border-gold-700"
                    : "border-border hover:border-border-strong focus:border-charcoal"
                } ${isLoading ? "opacity-75" : ""}`}
                placeholder="Enter your new password"
                value={password}
                onChange={handlePasswordChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-taupe-light hover:text-charcoal" />
                ) : (
                  <Eye className="h-5 w-5 text-taupe-light hover:text-charcoal" />
                )}
              </button>
            </div>

            {password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs text-taupe">Password Strength:</span>
                  <span
                    className={`font-body text-xs font-medium ${
                      passwordStrength.strength >= 4
                        ? "text-success"
                        : passwordStrength.strength >= 3
                        ? "text-gold-700"
                        : passwordStrength.strength >= 2
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-border">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {errors.password && Object.keys(errors.password).length > 0 && (
              <div className="space-y-1">
                {Object.entries(errors.password).map(([key, message]) => (
                  <p key={key} className="flex items-center gap-1 font-body text-xs text-red-600">
                    <span className="size-1 rounded-full bg-red-600"></span>
                    <span>{message}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block font-body text-sm font-medium text-charcoal">
              Confirm Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LockKeyhole className="h-5 w-5 text-taupe-light" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full rounded-xl border-2 py-3 pl-10 pr-12 font-body transition-all duration-200 focus:outline-none focus:ring-0 ${
                  errors.confirmPassword
                    ? "border-red-300 bg-red-50 focus:border-red-500"
                    : confirmPassword && password === confirmPassword
                    ? "border-success/40 bg-success/5 focus:border-success"
                    : confirmPassword
                    ? "border-gold-700/40 bg-gold-50/40 focus:border-gold-700"
                    : "border-border hover:border-border-strong focus:border-charcoal"
                } ${isLoading ? "opacity-75" : ""}`}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-taupe-light hover:text-charcoal" />
                ) : (
                  <Eye className="h-5 w-5 text-taupe-light hover:text-charcoal" />
                )}
              </button>
            </div>

            {errors.confirmPassword && (
              <p className="flex items-center gap-1 font-body text-sm text-red-600">
                <span className="size-1 rounded-full bg-red-600"></span>
                <span>{errors.confirmPassword}</span>
              </p>
            )}

            {confirmPassword && password === confirmPassword && !errors.confirmPassword && (
              <p className="flex items-center gap-1 font-body text-sm text-success">
                <CheckCircle size={14} />
                <span>Passwords match</span>
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
              onClick={handleSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3 font-body font-medium text-paper-white shadow-lg transition-all duration-200 hover:bg-charcoal disabled:cursor-not-allowed disabled:opacity-75 sm:w-auto"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>Reset Password</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-paper p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <h4 className="font-body text-sm font-medium text-charcoal">Password Guidelines</h4>
              <ul className="mt-1 space-y-1 font-body text-xs text-taupe">
                <li>• Use at least 8 characters</li>
                <li>• Include uppercase and lowercase letters</li>
                <li>• Add at least one number</li>
                <li>• Avoid common words or personal information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-ink" />
            <p className="mt-2 font-body text-sm text-taupe">Resetting password...</p>
          </div>
        </div>
      )}
    </div>
  );
}
