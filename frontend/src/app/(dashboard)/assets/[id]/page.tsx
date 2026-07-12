"use client";

import { useParams, useRouter } from "next/navigation";
import { useAsset, useDeleteAsset } from "@/features/assets/hooks/useAssets";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/layout/LoadingState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { AssetForm } from "@/features/assets/components/AssetForm";
import { useUpdateAsset } from "@/features/assets/hooks/useAssets";

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: asset, isLoading } = useAsset(id);
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    deleteAsset.mutate(id, {
      onSuccess: () => router.push("/assets"),
    });
  };

  if (isLoading) return <LoadingState variant="page" />;
  if (!asset) return <div className="py-16 text-center text-muted-foreground">Asset not found</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={asset.name}
        description={`Asset ID: ${asset.id.slice(0, 8)}...`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/assets")}>
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
        title="Delete asset?"
        description="This action cannot be undone."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Type</div>
                <div className="font-medium">{asset.type}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <StatusBadge status={asset.status} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{asset.location ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Parent</div>
                <div className="font-medium">{asset.parent_id ? asset.parent_id.slice(0, 8) + "…" : "—"}</div>
              </div>
            </div>
            {asset.description && (
              <div>
                <div className="text-sm text-muted-foreground">Description</div>
                <div className="mt-1 text-sm">{asset.description}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-sm font-medium">{new Date(asset.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Updated</div>
              <div className="text-sm font-medium">{new Date(asset.updated_at).toLocaleDateString()}</div>
            </div>
            {Object.keys(asset.attributes ?? {}).length > 0 && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Attributes</div>
                {Object.entries(asset.attributes).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span>{k}</span>
                    <span className="text-muted-foreground">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AssetForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={(data) => {
          updateAsset.mutate({ id, data });
          setEditOpen(false);
        }}
        asset={asset}
      />
    </div>
  );
}
