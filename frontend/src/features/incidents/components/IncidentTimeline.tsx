import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingState } from "@/components/layout/LoadingState";
import { EmptyState } from "@/components/layout/EmptyState";
import { useIncidentUpdates, useAddIncidentUpdate } from "@/features/incidents/hooks/useIncidents";
import { Clock, Send, Activity } from "lucide-react";

interface IncidentTimelineProps {
  incidentId: string;
}

const typeStyles: Record<string, string> = {
  created: "bg-blue-500",
  assigned: "bg-amber-500",
  updated: "bg-gray-500",
  resolved: "bg-emerald-500",
  closed: "bg-slate-500",
  update: "bg-purple-500",
};

export function IncidentTimeline({ incidentId }: IncidentTimelineProps) {
  const { data: updates, isLoading } = useIncidentUpdates(incidentId);
  const addUpdate = useAddIncidentUpdate();
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    addUpdate.mutate({ incidentId, data: { message: message.trim(), update_type: "update" } });
    setMessage("");
  };

  if (isLoading) return <LoadingState />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!updates || updates.length === 0) ? (
          <EmptyState
            icon={<Clock className="h-8 w-8" />}
            title="No updates yet"
            description="Log the first update for this incident."
          />
        ) : (
          <div className="space-y-4">
            {updates.map((u) => (
              <div key={u.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${typeStyles[u.update_type] ?? "bg-gray-400"}`} />
                  <div className="w-px flex-1 bg-border" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={u.update_type} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{u.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
          <Input
            placeholder="Add an update..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit" size="icon" disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
