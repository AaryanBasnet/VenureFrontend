// A Google Maps link usually carries the pin as "@27.67,85.43", "!3d27.67!4d85.43" or "?q=27.67,85.43".
export function coordsFromLink(text = "") {
  const m =
    text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    text.match(/[?&](?:q|ll|query)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
}

// Only real Google Maps addresses: the host is checked, not just how the text starts.
export function isMapsLink(text = "") {
  let url;
  try {
    url = new URL(text.trim());
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase();
  if (/^(www\.)?google\.(com|com\.np|co\.in|[a-z]{2})$/.test(host)) return url.pathname.startsWith("/maps");
  if (/^maps\.google\.(com|com\.np|co\.in|[a-z]{2})$/.test(host)) return true;
  if (host === "maps.app.goo.gl") return true;
  if (host === "goo.gl") return url.pathname.startsWith("/maps");
  return false;
}
