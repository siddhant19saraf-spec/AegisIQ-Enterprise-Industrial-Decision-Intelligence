import { useQuery } from "@tanstack/react-query";
import { digitalTwinApi } from "../api/digital_twin";

export function useDigitalTwinOverview() {
  return useQuery({
    queryKey: ["digital-twin", "overview"],
    queryFn: () => digitalTwinApi.overview(),
    refetchInterval: 15_000,
  });
}

export function useDigitalTwinFacilities() {
  return useQuery({
    queryKey: ["digital-twin", "facilities"],
    queryFn: () => digitalTwinApi.facilities(),
    refetchInterval: 15_000,
  });
}

export function useDigitalTwinTopology() {
  return useQuery({
    queryKey: ["digital-twin", "topology"],
    queryFn: () => digitalTwinApi.assets(),
    refetchInterval: 15_000,
  });
}

export function useDigitalTwinFacility(facilityId: string | null) {
  return useQuery({
    queryKey: ["digital-twin", "facility", facilityId],
    queryFn: () => digitalTwinApi.facility(facilityId!),
    enabled: !!facilityId,
    refetchInterval: 15_000,
  });
}
