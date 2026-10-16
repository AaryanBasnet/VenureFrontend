// "or with email" rule between the Google button and the form
export default function GoogleDivider() {
  return (
    <div className="flex w-full items-center gap-3.5" role="separator" aria-label="or">
      <div className="h-px flex-1 bg-border-strong" />
      <span aria-hidden="true" className="font-body text-caption uppercase tracking-[0.11em] text-taupe">
        or with email
      </span>
      <div className="h-px flex-1 bg-border-strong" />
    </div>
  );
}
