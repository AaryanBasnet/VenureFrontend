import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../../../auth/AuthProvider";
import {
  acceptQuotationApi,
  cancelInquiryApi,
  createBookingFromQuotationApi,
  getInquiryApi,
  getMyInquiriesApi,
  getQuotationApi,
  rejectQuotationApi,
} from "../../../api/user/inquiry";
import {
  createQuotationApi,
  declineInquiryApi,
  getOwnerInquiriesApi,
  withdrawQuotationApi,
} from "../../../api/owner/inquiry";

export const apiError = (error) =>
  error?.response?.data?.message || error?.response?.data?.errors?.[0]?.message || "Something went wrong. Please try again.";

// Waits for the session check, then sends logged-out visitors to the login page.
export function useRequireLogin() {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate("/login", { replace: true });
  }, [loading, isAuthenticated, navigate]);
  return { ready: !loading && isAuthenticated };
}

/* ── Customer ── */
export const useMyInquiries = (enabled = true) => useQuery({ queryKey: ["inquiries", "my"], queryFn: getMyInquiriesApi, enabled });
export const useInquiry = (id, enabled = true) => useQuery({ queryKey: ["inquiry", id], queryFn: () => getInquiryApi(id), enabled: !!id && enabled });
export const useQuotation = (id) => useQuery({ queryKey: ["quotation", id], queryFn: () => getQuotationApi(id), enabled: !!id });

// Every mutation refreshes the lists and the open inquiry so statuses never look stale.
function useRefreshing(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inquiries"] });
      qc.invalidateQueries({ queryKey: ["inquiry"] });
      qc.invalidateQueries({ queryKey: ["quotation"] });
      qc.invalidateQueries({ queryKey: ["owner-inquiries"] });
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
}

export const useCancelInquiry = () => useRefreshing(cancelInquiryApi);
export const useAcceptQuotation = () => useRefreshing(({ id, provider }) => acceptQuotationApi(id, provider));
export const useRejectQuotation = () => useRefreshing(rejectQuotationApi);
export const useBookFromQuotation = () => useRefreshing(createBookingFromQuotationApi);

/* ── Venue owner ── */
export const useOwnerInquiries = () => useQuery({ queryKey: ["owner-inquiries"], queryFn: getOwnerInquiriesApi });
export const useDeclineInquiry = () => useRefreshing(declineInquiryApi);
export const useCreateQuotation = () => useRefreshing(createQuotationApi);
export const useWithdrawQuotation = () => useRefreshing(withdrawQuotationApi);
