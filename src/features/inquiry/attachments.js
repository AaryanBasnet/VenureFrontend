export const MAX_FILES = 3;
export const MAX_BYTES = 5 * 1024 * 1024;
export const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const EXTENSIONS = /\.(pdf|jpe?g|png|webp)$/i;

export const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Adds the chosen files to the ones already picked. Returns the new list and a message for anything left out,
// so the person always hears why a file was not added.
export function addFiles(current, incoming, max = MAX_FILES) {
  const files = [...current];
  const problems = [];
  for (const file of incoming) {
    if (!TYPES.includes(file.type) && !(file.type === "" && EXTENSIONS.test(file.name))) {
      problems.push(`${file.name} is not a PDF, JPG, PNG or WebP file.`);
    } else if (file.size > MAX_BYTES) {
      problems.push(`${file.name} is larger than ${formatSize(MAX_BYTES)}.`);
    } else if (file.size === 0) {
      problems.push(`${file.name} is empty.`);
    } else if (files.some((f) => f.name === file.name && f.size === file.size)) {
      problems.push(`${file.name} is already added.`);
    } else if (files.length >= max) {
      problems.push(`You can add up to ${max} files.`);
      break;
    } else {
      files.push(file);
    }
  }
  return { files, error: problems.join(" ") };
}
