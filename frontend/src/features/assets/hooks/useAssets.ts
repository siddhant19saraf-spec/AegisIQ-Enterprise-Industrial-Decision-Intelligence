import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetsApi, type AssetFilters } from "../api/assets";
import type { AssetCreate, AssetUpdate } from "@/types";
import { toast } from "sonner";

const ASSETS_KEY = "assets";

export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: [ASSETS_KEY, filters],
    queryFn: () => assetsApi.list(filters),
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: [ASSETS_KEY, id],
    queryFn: () => assetsApi.get(id),
    enabled: !!id,
  });
}

export function useAssetTree() {
  return useQuery({
    queryKey: [ASSETS_KEY, "tree"],
    queryFn: () => assetsApi.list({ page_size: 500 }),
    select: (data) => data.items,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssetCreate) => assetsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSETS_KEY] });
      toast.success("Asset created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssetUpdate }) => assetsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSETS_KEY] });
      toast.success("Asset updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ASSETS_KEY] });
      toast.success("Asset deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
