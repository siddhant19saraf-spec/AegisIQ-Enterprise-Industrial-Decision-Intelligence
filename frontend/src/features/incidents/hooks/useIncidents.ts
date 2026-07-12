import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { incidentsApi, type IncidentFilters } from "../api/incidents";
import type { IncidentCreate, IncidentUpdate, IncidentUpdateCreate } from "@/types";
import { toast } from "sonner";

const INCIDENTS_KEY = "incidents";

export function useIncidents(filters?: IncidentFilters) {
  return useQuery({
    queryKey: [INCIDENTS_KEY, filters],
    queryFn: () => incidentsApi.list(filters),
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: [INCIDENTS_KEY, id],
    queryFn: () => incidentsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: IncidentCreate) => incidentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
      toast.success("Incident created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IncidentUpdate }) => incidentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
      toast.success("Incident updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incidentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY] });
      toast.success("Incident deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useIncidentUpdates(incidentId: string) {
  return useQuery({
    queryKey: [INCIDENTS_KEY, incidentId, "updates"],
    queryFn: () => incidentsApi.getUpdates(incidentId),
    enabled: !!incidentId,
  });
}

export function useAddIncidentUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, data }: { incidentId: string; data: IncidentUpdateCreate }) =>
      incidentsApi.addUpdate(incidentId, data),
    onSuccess: (_, { incidentId }) => {
      qc.invalidateQueries({ queryKey: [INCIDENTS_KEY, incidentId] });
      toast.success("Update added");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
