import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Box } from "lucide-react";

export default function DigitalTwinPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Twin"
        description="Real-time 3D visualization and simulation of industrial assets"
      />
      <EmptyState
        icon={<Box className="h-12 w-12" />}
        title="No digital twin configured"
        description="Connect an asset to view its digital twin in real time."
      />
    </div>
  );
}
