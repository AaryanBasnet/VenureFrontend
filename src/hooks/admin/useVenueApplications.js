import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approveApplicationApi, getApplicationApi, listApplicationsApi, rejectApplicationApi, resendApplicationLinkApi } from "../../api/venueApplications";

export const applicationError = (error) =>
  error?.response?.data?.message?.replace(/^Validation Error - /, "") || "Something went wrong. Please try again.";

// { items, total, pending, page, pages }. `pending` is the number still waiting, whatever the filter.
export const useApplications = ({ status, page = 1, limit = 10 }) =>
  useQuery({
    queryKey: ["applications", status ?? "all", page, limit],
    queryFn: () => listApplicationsApi({ status: status || undefined, page, limit }),
    placeholderData: keepPreviousData,
  });

// Just the number waiting, for the sidebar badge. One small request; refreshed when the window gets focus.
export const usePendingApplications = () =>
  useQuery({
    queryKey: ["applications", "pending-count"],
    queryFn: async () => (await listApplicationsApi({ status: "pending", page: 1, limit: 1 })).total,
    staleTime: 60_000,
  });

export const useApplication = (id) => useQuery({ queryKey: ["application", id], queryFn: () => getApplicationApi(id), enabled: !!id });

const useDecision = (fn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["application", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin_venues"] });
    },
  });
};

export const useApproveApplication = () => useDecision(({ id }) => approveApplicationApi(id));
export const useResendApplicationLink = () => useDecision(({ id }) => resendApplicationLinkApi(id));
export const useRejectApplication = () => useDecision(({ id, reason }) => rejectApplicationApi(id, reason));
