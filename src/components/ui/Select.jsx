import { ChevronDown } from "lucide-react";
import { inputClass } from "./formStyles";

// Native <select> (keyboard, screen reader and mobile pickers all work) restyled to match the text inputs:
// same height and border, one chevron in the same place everywhere. Pass `className` to override the base look.
export default function Select({ className = inputClass, children, ...props }) {
  return (
    <div className="relative">
      <select {...props} className={`${className} appearance-none pr-11`}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-taupe" strokeWidth={1.5} />
    </div>
  );
}
