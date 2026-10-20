import { useContext, useEffect, useState } from "react";
import { useGoToLogin } from "../../../auth/returnTo";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../../../auth/AuthProvider";
import {
  acceptQuotationApi,
  cancelInquiryApi,
  verifyEsewaPaymentApi,
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
  const goToLogin = useGoToLogin();
  useEffect(() => {
    if (!loading && !isAuthenticated) goToLogin({ replace: true });
  }, [loading, isAuthenticated, goToLogin]);
  return { ready: !loading && isAuthenticated };
}

/* ── Customer ── */
// A page at a time; the previous page stays on screen while the next one loads
export const useMyInquiries = (params, enabled = true) => useQuery({ queryKey: ["inquiries", "my", params], queryFn: () => getMyInquiriesApi(params), enabled, placeholderData: keepPreviousData });
export const useInquiry = (id, enabled = true) => useQuery({ queryKey: ["inquiry", id], queryFn: () => getInquiryApi(id), enabled: !!id && enabled });
export const useQuotation = (id) => useQuery({ queryKey: ["quotation", id], queryFn: () => getQuotationApi(id), enabled: !!id });

// The server marks a quotation expired the first time anyone opens it after its valid date, and puts the request back
// to "new". Remember the date so the page can say so, and refresh the request so its status catches up.
export function useExpiredQuotation(quotation) {
  const qc = useQueryClient();
  const seen = quotation?.status === "expired" ? quotation.validUntil : null;
  const [expiredOn, setExpiredOn] = useState(null);
  if (seen && seen !== expiredOn) setExpiredOn(seen);
  useEffect(() => {
    if (!seen) return;
    qc.invalidateQueries({ queryKey: ["inquiry"] });
    qc.invalidateQueries({ queryKey: ["inquiries"] });
    qc.invalidateQueries({ queryKey: ["owner-inquiries"] });
  }, [seen, qc]);
  return expiredOn;
}

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
export const useAcceptQuotation = () => useRefreshing(acceptQuotationApi);
export const useRejectQuotation = () => useRefreshing(rejectQuotationApi);
export const useVerifyEsewaPayment = () => useRefreshing(verifyEsewaPaymentApi);

/* ── Venue owner ── */
// The owner's "needs a reply" requests: the badge, the dashboard and the first inquiries tab share this one query
export const WAITING = { group: "pending", limit: 5 };
export const useOwnerInquiries = (params) => useQuery({ queryKey: ["owner-inquiries", params], queryFn: () => getOwnerInquiriesApi(params), placeholderData: keepPreviousData });
export const useDeclineInquiry = () => useRefreshing(declineInquiryApi);
export const useCreateQuotation = () => useRefreshing(createQuotationApi);
export const useWithdrawQuotation = () => useRefreshing(withdrawQuotationApi);
