import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { GitBranch } from "lucide-react";

export default function KnowledgeGraphPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Graph"
        description="Explore relationships across your industrial ecosystem"
      />
      <EmptyState
        icon={<GitBranch className="h-12 w-12" />}
        title="Graph not yet built"
        description="The knowledge graph will populate as assets and incidents are registered."
      />
    </div>
  );
}
