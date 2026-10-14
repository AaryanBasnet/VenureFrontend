import { useEffect } from "react";

// After a failed submit, move focus to the first field with an error so keyboard and screen reader users land on it.
export function useFocusFirstError(formRef, { submitCount, isSubmitting, isValid }) {
  useEffect(() => {
    if (submitCount > 0 && !isSubmitting && !isValid) formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    // Run once per submit attempt, after validation has finished.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount, isSubmitting]);
}
