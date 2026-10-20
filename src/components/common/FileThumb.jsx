import { useEffect, useRef } from "react";

// A preview of a chosen image file, drawn on a canvas. The picture never becomes an address or markup on the page.
// The frame keeps its size from the className; the image fills it like object-fit: cover.
export default function FileThumb({ file, label, width = 480, height = 360, className = "" }) {
  const canvas = useRef(null);
  useEffect(() => {
    let cancelled = false;
    createImageBitmap(file)
      .then((bitmap) => {
        const el = canvas.current;
        if (cancelled || !el) return bitmap.close();
        el.width = width;
        el.height = height;
        const scale = Math.max(width / bitmap.width, height / bitmap.height);
        const w = bitmap.width * scale;
        const h = bitmap.height * scale;
        el.getContext("2d").drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
        bitmap.close();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [file, width, height]);
  return <canvas ref={canvas} role="img" aria-label={label} className={`bg-sand object-cover ${className}`} />;
}
