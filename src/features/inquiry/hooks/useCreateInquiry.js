import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInquiryApi } from "../../../api/user/inquiry";

// Surfaces the backend's message (for example "This space can hold up to 120 guests").
export const inquiryErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.errors?.[0]?.message ||
  (error?.response ? "We could not send your request. Please try again." : "We could not reach the server. Check your connection and try again.");

// A new request must show up in My inquiries straight away, not after the cache expires.
export const useCreateInquiry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => (await createInquiryApi(payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inquiries"] }),
  });
};
