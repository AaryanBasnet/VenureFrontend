import { useId, useRef, useState } from "react";
import { FileText, Image as ImageIcon, Loader2, Paperclip, X } from "lucide-react";
import { getInquiryAttachmentLinkApi, removeInquiryAttachmentApi, uploadInquiryAttachmentsApi } from "../../../api/user/inquiry";
import { ACCEPT, MAX_FILES, addFiles, formatSize } from "../attachments";
import { apiError } from "../hooks/useInquiries";

const FileIcon = ({ type }) => {
  const Icon = type === "application/pdf" ? FileText : ImageIcon;
  return <Icon aria-hidden="true" className="size-4 shrink-0 text-gold-800" />;
};
const rowText = "inline-flex min-h-11 min-w-0 items-center gap-2 font-body text-small text-ink";
const removeBtn = "-mr-2 rounded-full p-3 text-taupe hover:text-ink focus-visible:outline-2 focus-visible:outline-ink disabled:opacity-50";

// The "choose files" button and the list of what has been chosen. `files` are File objects not yet uploaded
// (the request form); `uploaded` are files already on the request. Together they share the limit of three.
export function AttachmentPicker({ files, onChange, uploaded = [], busy = false, label = "Attach your menu (optional)" }) {
  const inputId = useId();
  const hintId = useId();
  const input = useRef(null);
  const [error, setError] = useState("");
  const room = MAX_FILES - uploaded.length;

  const pick = (e) => {
    const result = addFiles(files, Array.from(e.target.files ?? []), room);
    onChange(result.files);
    setError(result.error);
    e.target.value = ""; // the same file can be chosen again after removing it
  };

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block font-body text-eyebrow uppercase text-taupe">{label}</label>
      <p id={hintId} className="mb-2 font-body text-caption text-taupe">A menu card, photo or guest list. PDF, JPG, PNG or WebP, up to 5 MB each, {MAX_FILES} files at most.</p>
      <input ref={input} id={inputId} type="file" multiple accept={ACCEPT} onChange={pick} disabled={busy || room <= 0} aria-describedby={hintId} className="sr-only" />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy || room <= 0}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink px-5 py-2.5 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Paperclip aria-hidden="true" className="size-4" /> {files.length ? "Add another file" : "Choose a file"}
      </button>
      {files.length > 0 && (
        <ul aria-label="Files to send" className="mt-3 divide-y divide-line rounded-card-sm border border-line bg-white">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-3 px-3">
              <span className={rowText}>
                <FileIcon type={f.type} />
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-caption text-taupe">{formatSize(f.size)}</span>
              </span>
              <button type="button" onClick={() => { onChange(files.filter((_, j) => j !== i)); setError(""); }} disabled={busy} aria-label={`Remove ${f.name}`} className={removeBtn}>
                <X aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="mt-2 font-body text-small text-red-700">{error}</p>}
    </div>
  );
}

// Opens a file the customer sent. The link is asked for at the moment of the click and only lasts a few minutes.
function useOpenFile(inquiryId) {
  const [opening, setOpening] = useState(null);
  const [error, setError] = useState("");
  const open = async (file) => {
    setError("");
    setOpening(file._id);
    const tab = window.open("", "_blank"); // opened first so the browser does not treat it as a popup
    try {
      const url = await getInquiryAttachmentLinkApi(inquiryId, file._id);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (err) {
      tab?.close();
      setError(apiError(err));
    } finally {
      setOpening(null);
    }
  };
  return { open, opening, error };
}

// What the request carries, on the request page. The owner can only open files; the customer can also add and
// remove them while the request is still open (`editable`).
export default function RequestFiles({ inquiry, editable = false, onChanged }) {
  const files = inquiry.attachments ?? [];
  const { open, opening, error } = useOpenFile(inquiry._id);
  const [adding, setAdding] = useState([]);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  if (!editable && files.length === 0) return null;

  const run = async (action) => {
    setBusy(true);
    setFailure("");
    try {
      await action();
      onChanged?.();
    } catch (err) {
      setFailure(apiError(err));
    } finally {
      setBusy(false);
    }
  };
  const upload = () => run(async () => { await uploadInquiryAttachmentsApi(inquiry._id, adding); setAdding([]); });
  const remove = (file) => run(() => removeInquiryAttachmentApi(inquiry._id, file._id));

  return (
    <section aria-labelledby="request-files" className="mt-6">
      <h3 id="request-files" className="font-body text-eyebrow uppercase text-taupe">{editable ? "Your files" : "Files from the customer"}</h3>
      {files.length === 0 && <p className="mt-2 font-body text-small text-taupe">No files yet.</p>}
      {files.length > 0 && (
        <ul className="mt-2 divide-y divide-line rounded-card-sm border border-line bg-white">
          {files.map((f) => (
            <li key={f._id} className="flex items-center justify-between gap-3 px-3">
              <button type="button" onClick={() => open(f)} disabled={opening === f._id} className={`${rowText} underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ink`}>
                {opening === f._id ? <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" /> : <FileIcon type={f.mimeType} />}
                <span className="truncate">{f.originalName}</span>
                <span className="shrink-0 text-caption text-taupe">{formatSize(f.size)}</span>
                <span className="sr-only">(opens in a new tab)</span>
              </button>
              {editable && (
                <button type="button" onClick={() => remove(f)} disabled={busy} aria-label={`Remove ${f.originalName}`} className={removeBtn}>
                  <X aria-hidden="true" className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="mt-2 font-body text-small text-red-700">{error}</p>}
      {editable && files.length < MAX_FILES && (
        <div className="mt-4">
          <AttachmentPicker files={adding} onChange={setAdding} uploaded={files} busy={busy} label="Add a file" />
          {adding.length > 0 && (
            <button type="button" onClick={upload} disabled={busy} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 py-2.5 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60">
              {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />} {busy ? "Sending" : `Send ${adding.length === 1 ? "file" : "files"}`}
            </button>
          )}
        </div>
      )}
      {failure && <p role="alert" className="mt-2 font-body text-small text-red-700">{failure}</p>}
    </section>
  );
}
