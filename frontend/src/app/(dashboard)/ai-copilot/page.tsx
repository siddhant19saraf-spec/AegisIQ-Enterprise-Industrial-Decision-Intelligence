import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { BrainCircuit } from "lucide-react";

export default function AiCopilotPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Copilot"
        description="Natural language interface for industrial insights"
      />
      <EmptyState
        icon={<BrainCircuit className="h-12 w-12" />}
        title="AI Copilot ready"
        description="Ask questions about your assets, incidents, and operations."
      />
    </div>
  );
}
