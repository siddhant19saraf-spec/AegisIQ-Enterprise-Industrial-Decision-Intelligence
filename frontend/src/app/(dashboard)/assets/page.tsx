"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        description="Manage and monitor your industrial equipment"
        actions={<Button>Add Asset</Button>}
      />
      <EmptyState
        icon={<Cpu className="h-12 w-12" />}
        title="No assets registered"
        description="Add your first asset to start monitoring industrial equipment."
        action={{ label: "Add Asset", onClick: () => {} }}
      />
    </div>
  );
}
