import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: () => dashboardApi.summary(),
    refetchInterval: 30_000,
  });
}
