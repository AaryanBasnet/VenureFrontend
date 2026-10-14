import { useQuery } from "@tanstack/react-query";
import { fetchActivityLogsService } from "../../services/admin/dashboardService";

export const useActivityLogs = () =>
  useQuery({
    queryKey: ["activity_logs"],
    queryFn: fetchActivityLogsService,
  });
