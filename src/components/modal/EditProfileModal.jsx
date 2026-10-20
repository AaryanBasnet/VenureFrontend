import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { AnimatePresence, m as motion } from "framer-motion";
import Button from "../ui/Button";
import { errorClass, inputClass, labelClass } from "../ui/formStyles";
import FileThumb from "../common/FileThumb";
import { assetUrl } from "../../utils/assetUrl";

// Edit-profile dialog. Sends multipart form data: name, phone, address and an optional profile image.
const EditProfileModal = ({ user, onClose, onSubmit, isLoading }) => {
  const [form, setForm] = useState({ name: user.name || "", phone: user.phone || "", address: user.address || "" });
  const [file, setFile] = useState(null);
  const current = assetUrl(user.avatar);
  const preview = file || current;
  const [errors, setErrors] = useState({});
  const firstField = useRef(null);
  const dialog = useRef(null);
  const opener = useRef(typeof document === "undefined" ? null : document.activeElement);

  // Focus moves into the dialog, and back to whatever opened it when it closes.
  useEffect(() => {
    firstField.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const back = opener.current;
    return () => {
      document.body.style.overflow = previous;
      if (back?.isConnected) back.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !isLoading) return onClose();
      if (e.key !== "Tab" || !dialog.current) return undefined;
      // Keep Tab inside the dialog
      const items = [...dialog.current.querySelectorAll('button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => !el.disabled && (el.offsetParent !== null || el.type === "file")
      );
      if (!items.length) return undefined;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialog.current.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !dialog.current.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
      return undefined;
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, isLoading]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = "Please enter your name.";
    const digits = form.phone.replace(/\D/g, "");
    if (form.phone.trim() && (!/^[+\d][\d\s-]*$/.test(form.phone.trim()) || digits.length < 7 || digits.length > 15)) {
      found.phone = "Enter a phone number with 7 to 15 digits, for example 98XXXXXXXX.";
    }
    if (form.address.length > 150) found.address = "Please keep the address under 150 characters.";
    if (file && !file.type.startsWith("image/")) found.file = "Please choose an image file (JPG or PNG).";
    else if (file && file.size > 5 * 1024 * 1024) found.file = "Please choose an image under 5 MB.";
    setErrors(found);
    if (Object.keys(found).length) {
      // Take the user to the first problem
      const firstBad = ["name", "phone", "address", "file"].find((k) => found[k]);
      dialog.current?.querySelector(`#${{ name: "p-name", phone: "p-phone", address: "p-address", file: "avatar" }[firstBad]}`)?.focus();
      return;
    }

    const data = new FormData();
    data.append("name", form.name.trim());
    data.append("phone", form.phone.trim());
    data.append("address", form.address.trim());
    if (file) data.append("profileImage", file);
    onSubmit(data);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/60 px-4 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => !isLoading && onClose()}
      >
        <motion.div
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          className="relative max-h-full w-full max-w-lg overflow-y-auto rounded-card-xl bg-cream p-6 shadow-2xl sm:p-8"
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" onClick={onClose} disabled={isLoading} aria-label="Close" className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-taupe hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-ink">
            <X aria-hidden="true" className="size-5" />
          </button>

          <p className="font-body text-eyebrow uppercase text-gold-800">Your account</p>
          <h2 id="edit-profile-title" className="mt-2 font-display text-h3 font-light text-ink">Edit profile</h2>

          <form onSubmit={submit} noValidate className="mt-6 space-y-5">
            <div className="flex items-center gap-4">
              {file ? (
                <FileThumb file={file} label="Your new photo" width={160} height={160} className="size-20 rounded-full border border-line" />
              ) : current ? (
                <img src={current} alt="" className="size-20 rounded-full border border-line object-cover" />
              ) : (
                <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-full bg-gold-100 text-gold-800">
                  <Camera className="size-7" strokeWidth={1.25} />
                </span>
              )}
              <div>
                <label htmlFor="avatar" className="cursor-pointer font-body text-small text-gold-800 underline underline-offset-4 hover:text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ink">
                  {preview ? "Change photo" : "Add a photo"}
                  <input id="avatar" type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={isLoading} aria-invalid={errors.file ? "true" : undefined} aria-describedby={errors.file ? "avatar-error" : undefined} />
                </label>
                {errors.file && <p id="avatar-error" role="alert" className={errorClass}>{errors.file}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="p-name" className={labelClass}>Full name</label>
              <input ref={firstField} id="p-name" value={form.name} onChange={set("name")} autoComplete="name" className={inputClass} aria-invalid={errors.name ? "true" : undefined} aria-describedby={errors.name ? "p-name-error" : undefined} disabled={isLoading} />
              {errors.name && <p id="p-name-error" className={errorClass}>{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="p-phone" className={labelClass}>Phone</label>
              <input id="p-phone" type="tel" inputMode="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="98XXXXXXXX" className={inputClass} aria-invalid={errors.phone ? "true" : undefined} aria-describedby={errors.phone ? "p-phone-error" : undefined} disabled={isLoading} />
              {errors.phone && <p id="p-phone-error" className={errorClass}>{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="p-address" className={labelClass}>Address</label>
              <input id="p-address" value={form.address} onChange={set("address")} autoComplete="street-address" maxLength={150} className={inputClass} aria-invalid={errors.address ? "true" : undefined} aria-describedby={errors.address ? "p-address-error" : undefined} disabled={isLoading} />
              {errors.address && <p id="p-address-error" className={errorClass}>{errors.address}</p>}
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <Button type="button" variant="outline-dark" onClick={onClose} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                {isLoading ? "Saving" : "Save changes"}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
