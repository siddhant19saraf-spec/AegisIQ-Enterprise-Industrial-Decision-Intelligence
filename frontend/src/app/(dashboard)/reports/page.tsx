"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and schedule operational reports"
        actions={<Button>New Report</Button>}
      />
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="No reports yet"
        description="Create your first report to export operational data."
        action={{ label: "New Report", onClick: () => {} }}
      />
    </div>
  );
}
