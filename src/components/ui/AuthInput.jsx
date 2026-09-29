import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Icon-led input for the auth forms (Figma "Design system" page, Login/Register
 * panel "Input" component). `type="password"` gets a built-in show/hide toggle.
 */
export default function AuthInput({
  icon: Icon,
  label,
  type = "text",
  error,
  hint,
  className = "",
  ...props
}) {
  const [revealed, setRevealed] = useState(false);
  const autoId = useId();
  const id = props.id || autoId;
  const isPassword = type === "password";
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={`flex w-full flex-col items-start gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-body text-[13px] font-medium text-charcoal">
          {label}
        </label>
      )}
      <div
        className={`flex h-[54px] w-full items-center gap-3 rounded-xl border bg-white px-4 focus-within:border-charcoal ${
          error ? "border-red-400" : "border-border"
        }`}
      >
        {Icon && <Icon aria-hidden="true" className="size-[18px] shrink-0 text-taupe-light" strokeWidth={1.75} />}
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={errorId || hintId}
          className="w-full min-w-0 flex-1 bg-transparent font-body text-[14px] text-charcoal placeholder:text-taupe-light focus:outline-none"
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="shrink-0 text-taupe-light hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
          >
            {revealed ? <EyeOff aria-hidden="true" className="size-[18px]" strokeWidth={1.75} /> : <Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="font-body text-[12px] text-red-600">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="font-body text-[11px] leading-[1.4] text-taupe-light">
          {hint}
        </p>
      )}
    </div>
  );
}
