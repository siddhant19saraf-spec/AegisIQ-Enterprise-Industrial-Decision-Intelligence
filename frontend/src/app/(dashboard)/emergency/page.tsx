"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { emergencyApi, type EmergencyAlert, type Worker } from "@/features/emergency/api/emergency";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/layout/LoadingState";
import {
  AlertTriangle, Phone, Users, Flame, Wind, Activity,
  Syringe, Ambulance, CheckCircle, Clock, MapPin, Shield,
} from "lucide-react";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  FIRE: <Flame className="h-5 w-5" />, GAS_LEAK: <Wind className="h-5 w-5" />, MEDICAL: <Syringe className="h-5 w-5" />,
  SOS: <AlertTriangle className="h-5 w-5" />, CRITICAL_INCIDENT: <Activity className="h-5 w-5" />,
  ASSET_CRITICAL: <Shield className="h-5 w-5" />,
};

function WorkerCard({ worker, onSOS }: { worker: Worker; onSOS: (w: Worker) => void }) {
  return (
    <Card className={`relative ${worker.is_on_duty ? "" : "opacity-60"}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${worker.is_on_duty ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-muted"}`}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{worker.name}</p>
              <p className="text-xs text-muted-foreground">{worker.role}</p>
            </div>
          </div>
          <Badge variant={worker.is_on_duty ? "default" : "secondary"} className="text-[10px]">
            {worker.is_on_duty ? "On Duty" : "Off"}
          </Badge>
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {worker.phone}</p>
          {worker.facility && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {worker.facility}</p>}
          {worker.blood_group && <p>Blood: <span className="font-medium text-red-600">{worker.blood_group}</span></p>}
          {worker.medical_conditions && <p className="text-amber-600">⚠ {worker.medical_conditions}</p>}
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="destructive" className="flex-1 h-8 text-xs" onClick={() => onSOS(worker)}>
            <AlertTriangle className="mr-1 h-3 w-3" /> SOS
          </Button>
          <Button size="sm" variant="outline" className="h-8 w-8" title="Call emergency contact">
            <Phone className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertCard({ alert }: { alert: EmergencyAlert }) {
  return (
    <div className={`rounded-lg border p-4 ${alert.severity === "critical" ? "border-red-500 bg-red-50/50 dark:bg-red-950/20" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
            alert.severity === "critical" ? "bg-red-100 dark:bg-red-900/30" : "bg-orange-100 dark:bg-orange-900/30"
          }`}>
            {TYPE_ICONS[alert.type] || <AlertTriangle className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm">{alert.title}</p>
              <Badge variant={alert.status === "active" ? "destructive" : "secondary"} className="text-[10px]">
                {alert.status}
              </Badge>
            </div>
            {alert.description && <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {alert.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {alert.location}</span>}
        <span className={`flex items-center gap-1 ${alert.ambulance_dispatched ? "text-emerald-600" : ""}`}>
          <Ambulance className="h-3 w-3" />
          {alert.ambulance_dispatched ? `Ambulance dispatched — ETA ${alert.ambulance_eta_minutes} min` : "No ambulance"}
        </span>
        {alert.auto_detected && <Badge variant="outline" className="text-[10px]">Auto-Detected</Badge>}
        {alert.created_at && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(alert.created_at).toLocaleString()}</span>}
      </div>
    </div>
  );
}

export default function EmergencyPage() {
  const queryClient = useQueryClient();
  const [alertTab, setAlertTab] = useState("active");
  const [dispatchMsg, setDispatchMsg] = useState<{ alert_id: string; eta: number; hospital: string; ambulance: string; contact: string } | null>(null);

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["emergency-alerts", alertTab],
    queryFn: () => emergencyApi.getAlerts(alertTab === "all" ? undefined : alertTab),
  });

  const { data: workers, isLoading: workersLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: emergencyApi.getWorkers,
  });

  const { data: autoDetect } = useQuery({
    queryKey: ["emergency-auto-detect"],
    queryFn: emergencyApi.autoDetect,
    refetchInterval: 30000,
  });

  const sosMutation = useMutation({
    mutationFn: (worker: Worker) =>
      emergencyApi.sendSOS({ worker_id: worker.id, location: worker.facility || undefined, description: `Medical emergency — ${worker.name}` }),
    onSuccess: (res) => {
      setDispatchMsg({ alert_id: res.alert_id, eta: res.ambulance_eta, hospital: "", ambulance: "", contact: "108" });
      queryClient.invalidateQueries({ queryKey: ["emergency-alerts"] });
    },
  });

  const activeAlerts = alerts?.filter((a) => a.status === "active") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Emergency Response</h1>
          <p className="text-sm text-muted-foreground">Real-time safety monitoring, SOS alerts, and ambulance dispatch across all facilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-sm px-3 py-1">
            <AlertTriangle className="mr-1 h-4 w-4" />
            {activeAlerts.length} Active
          </Badge>
        </div>
      </div>

      {/* Auto-detect banner */}
      {autoDetect?.detected && (
        <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-600">🚨 EMERGENCY AUTO-DETECTED</h3>
            <p className="text-sm mt-1">{autoDetect.title} — {autoDetect.description}</p>
            <p className="text-xs text-muted-foreground mt-1">Confidence: {autoDetect.confidence}% | Severity: {autoDetect.severity}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="destructive" onClick={async () => {
                const alerts = await emergencyApi.getAlerts("active");
                if (alerts.length > 0) {
                  const dispatch = await emergencyApi.dispatchAmbulance(alerts[0].id);
                  setDispatchMsg({ alert_id: dispatch.alert_id, eta: dispatch.eta_minutes, hospital: dispatch.hospital, ambulance: dispatch.ambulance_id, contact: dispatch.contact_number });
                }
              }}>
                <Ambulance className="mr-1 h-4 w-4" /> Dispatch Ambulance
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch confirmation */}
      {dispatchMsg && (
        <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
            <div>
              <h3 className="font-bold text-emerald-700">✅ Ambulance Dispatched!</h3>
              <p className="text-sm text-emerald-600">ETA: {dispatchMsg.eta} minutes | {dispatchMsg.hospital} | Contact: {dispatchMsg.contact}</p>
              {dispatchMsg.ambulance && <p className="text-xs text-muted-foreground">Ambulance: {dispatchMsg.ambulance}</p>}
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts"><AlertTriangle className="mr-1 h-3 w-3" /> Alerts</TabsTrigger>
          <TabsTrigger value="workers"><Users className="mr-1 h-3 w-3" /> Workers</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4 space-y-4">
          <Tabs value={alertTab} onValueChange={setAlertTab}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          {alertsLoading ? <LoadingState variant="page" /> : (
            <div className="space-y-3">
              {alerts && alerts.length > 0 ? alerts.map((a) => <AlertCard key={a.id} alert={a} />) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  <CheckCircle className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <p>No {alertTab} alerts. All clear.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workers" className="mt-4">
          {workersLoading ? <LoadingState variant="page" /> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workers?.map((w) => (
                <WorkerCard key={w.id} worker={w} onSOS={(worker) => sosMutation.mutate(worker)} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
