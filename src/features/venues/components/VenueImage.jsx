import { useState } from "react";
import { ImageOff } from "lucide-react";

// A photo that never leaves a broken-image icon behind: when the file is missing or fails to load,
// a quiet placeholder takes its place. Pass no `src` to show the placeholder straight away.
export default function VenueImage({ src, alt = "", className = "", iconClassName = "size-8", ...rest }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div aria-hidden="true" className={`flex items-center justify-center bg-gradient-to-br from-gold-100 to-gold-200 ${className}`}>
        <ImageOff className={`${iconClassName} text-gold-800/50`} strokeWidth={1.25} />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} {...rest} />;
}
