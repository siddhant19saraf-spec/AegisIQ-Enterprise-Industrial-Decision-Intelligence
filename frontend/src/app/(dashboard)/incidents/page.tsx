"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function IncidentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description="Track, investigate, and resolve operational incidents"
        actions={<Button>Report Incident</Button>}
      />
      <EmptyState
        icon={<AlertTriangle className="h-12 w-12" />}
        title="No incidents reported"
        description="All systems are operating normally."
        action={{ label: "Report Incident", onClick: () => {} }}
      />
    </div>
  );
}
