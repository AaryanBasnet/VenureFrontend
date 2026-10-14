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
  const { "aria-describedby": extraDescribedBy, ...inputProps } = props;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId || hintId, extraDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex w-full flex-col items-start gap-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="font-body text-small font-medium text-charcoal">
          {label}
        </label>
      )}
      <div
        className={`flex h-[54px] w-full items-center gap-3 rounded-xl border bg-white px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-charcoal ${
          error ? "border-red-700" : "border-border-strong"
        } ${inputProps.disabled ? "opacity-60" : ""}`}
      >
        {Icon && <Icon aria-hidden="true" className="size-[18px] shrink-0 text-taupe-light" strokeWidth={1.75} />}
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className="w-full min-w-0 flex-1 bg-transparent font-body text-body-lg text-charcoal placeholder:text-taupe focus:outline-none sm:text-small"
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label="Show password"
            aria-pressed={revealed}
            className="-mr-3 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-taupe hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-charcoal"
          >
            {revealed ? <EyeOff aria-hidden="true" className="size-[18px]" strokeWidth={1.75} /> : <Eye aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="font-body text-caption text-red-700">
          {error}
        </p>
      )}
      {!error && hint && (
        <p id={hintId} className="font-body text-caption text-taupe">
          {hint}
        </p>
      )}
    </div>
  );
}
