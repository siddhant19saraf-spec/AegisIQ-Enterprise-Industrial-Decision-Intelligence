import { api } from "@/lib/api/client";

export interface Worker {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  location: string | null;
  facility: string | null;
  emergency_contact: string | null;
  medical_conditions: string | null;
  blood_group: string | null;
  is_on_duty: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface EmergencyAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string | null;
  location: string | null;
  facility: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  worker_id: string | null;
  source: string;
  auto_detected: boolean;
  ambulance_dispatched: boolean;
  ambulance_eta_minutes: number;
  created_at: string;
}

export interface SOSResponse {
  success: boolean;
  message: string;
  alert_id: string;
  ambulance_dispatched: boolean;
  ambulance_eta: number;
  emergency_message: string;
}

export interface AmbulanceDispatch {
  alert_id: string;
  dispatched: boolean;
  eta_minutes: number;
  hospital: string;
  ambulance_id: string;
  contact_number: string;
}

export interface AutoDetectResult {
  detected: boolean;
  alert_type?: string;
  severity?: string;
  title?: string;
  description?: string;
  confidence?: number;
  affected_assets?: string[];
  affected_workers?: string[];
}

export const emergencyApi = {
  sendSOS: (data: { worker_id?: string; location?: string; description?: string; latitude?: number; longitude?: number }) =>
    api.post<SOSResponse>("/api/v1/emergency/sos", data),

  autoDetect: () => api.get<AutoDetectResult>("/api/v1/emergency/auto-detect"),

  dispatchAmbulance: (alertId: string, location?: string) =>
    api.post<AmbulanceDispatch>(`/api/v1/emergency/dispatch-ambulance?alert_id=${alertId}${location ? `&location=${encodeURIComponent(location)}` : ""}`),

  getAlerts: (status?: string) => api.get<EmergencyAlert[]>(`/api/v1/emergency/alerts${status ? `?status=${status}` : ""}`),

  getWorkers: () => api.get<Worker[]>("/api/v1/emergency/workers"),

  checkIn: (data: { worker_id: string; healthy: boolean }) => api.post("/api/v1/emergency/workers/check-in", data),
};
