"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AssetCards } from "@/features/assets/components/AssetCards";
import { AssetTable } from "@/features/assets/components/AssetTable";
import { AssetForm } from "@/features/assets/components/AssetForm";
import { useAssets, useCreateAsset, useUpdateAsset } from "@/features/assets/hooks/useAssets";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { Asset } from "@/types";

export default function AssetsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filters = {
    page,
    page_size: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
  };

  const { data, isLoading } = useAssets(filters);
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();

  const handleSubmit = useCallback(
    (formData: { name: string; type: string; status: "operational" | "maintenance" | "offline" | "critical"; location?: string | null; description?: string | null }) => {
      if (editingAsset) {
        updateAsset.mutate({ id: editingAsset.id, data: formData });
      } else {
        createAsset.mutate(formData);
      }
      setFormOpen(false);
      setEditingAsset(null);
    },
    [editingAsset, createAsset, updateAsset],
  );

  const stats = {
    total: data?.total ?? 0,
    operational: data?.items?.filter((a) => a.status === "operational").length ?? 0,
    maintenance: data?.items?.filter((a) => a.status === "maintenance").length ?? 0,
    offline: data?.items?.filter((a) => a.status === "offline" || a.status === "critical").length ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assets"
        description="Manage and monitor your industrial equipment"
        actions={
          <Button onClick={() => { setEditingAsset(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Asset
          </Button>
        }
      />
      <AssetCards {...stats} />
      <AssetTable
        assets={data?.items ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={20}
        isLoading={isLoading}
        search={search}
        statusFilter={statusFilter}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
        onPageChange={setPage}
      />
      <AssetForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingAsset(null); }}
        onSubmit={handleSubmit}
        asset={editingAsset}
      />
    </div>
  );
}
