import { useMutation } from "@tanstack/react-query";
import { createInquiryApi } from "../../../api/user/inquiry";

// Surfaces the backend's message (for example "This space can hold up to 120 guests").
export const inquiryErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.errors?.[0]?.message ||
  "We could not send your request. Please try again.";

export const useCreateInquiry = () =>
  useMutation({ mutationFn: async (payload) => (await createInquiryApi(payload)).data });
