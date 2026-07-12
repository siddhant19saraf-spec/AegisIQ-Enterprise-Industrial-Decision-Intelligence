"use client";

import { useParams, useRouter } from "next/navigation";
import { useIncident, useUpdateIncident, useDeleteIncident } from "@/features/incidents/hooks/useIncidents";
import { IncidentTimeline } from "@/features/incidents/components/IncidentTimeline";
import { IncidentForm } from "@/features/incidents/components/IncidentForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/layout/LoadingState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: incident, isLoading } = useIncident(id);
  const updateIncident = useUpdateIncident();
  const deleteIncident = useDeleteIncident();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    deleteIncident.mutate(id, { onSuccess: () => router.push("/incidents") });
  };

  if (isLoading) return <LoadingState variant="page" />;
  if (!incident) return <div className="py-16 text-center text-muted-foreground">Incident not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={incident.title}
        description={`Incident ID: ${incident.id.slice(0, 8)}...`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/incidents")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        }
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Delete incident?"
        description="This action cannot be undone."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <IncidentTimeline incidentId={id} />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Severity</div>
                <StatusBadge status={incident.severity} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <StatusBadge status={incident.status} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Risk Score</div>
                <div className="font-medium">{incident.risk_score != null ? (incident.risk_score * 100).toFixed(0) + "%" : "—"}</div>
              </div>
              {incident.description && (
                <div>
                  <div className="text-sm text-muted-foreground">Description</div>
                  <div className="mt-1 text-sm">{incident.description}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-sm font-medium">{new Date(incident.created_at).toLocaleString()}</div>
              </div>
              {incident.detected_at && (
                <div>
                  <div className="text-sm text-muted-foreground">Detected</div>
                  <div className="text-sm font-medium">{new Date(incident.detected_at).toLocaleString()}</div>
                </div>
              )}
              {incident.resolved_at && (
                <div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                  <div className="text-sm font-medium">{new Date(incident.resolved_at).toLocaleString()}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Updated</div>
                <div className="text-sm font-medium">{new Date(incident.updated_at).toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <IncidentForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={(data) => {
          updateIncident.mutate({ id, data });
          setEditOpen(false);
        }}
        incident={incident}
      />
    </div>
  );
}
