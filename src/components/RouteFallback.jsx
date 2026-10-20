// Shown inside a layout (header and footer stay put) while a page's code loads. Light and quiet: no splash.
// It is announced politely to screen readers as "Loading".
const RouteFallback = ({ label = "Loading", bare = false }) => (
  <div role="status" aria-live="polite" className={bare ? "min-h-[50vh] py-10" : "container-site min-h-[100svh] py-16"}>
    <span className="sr-only">{label}</span>
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="h-3 w-24 rounded-full bg-line" />
      <div className="h-10 w-2/3 max-w-xl rounded-card-sm bg-line" />
      <div className="h-4 w-full max-w-2xl rounded-full bg-line/70" />
      <div className="grid gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-56 rounded-card-md bg-line/60" />
        <div className="hidden h-56 rounded-card-md bg-line/60 sm:block" />
        <div className="hidden h-56 rounded-card-md bg-line/60 lg:block" />
      </div>
    </div>
  </div>
);

export default RouteFallback;
