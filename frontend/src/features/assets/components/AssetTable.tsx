import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingState } from "@/components/layout/LoadingState";
import { EmptyState } from "@/components/layout/EmptyState";
import type { Asset } from "@/types";
import { Search, ChevronLeft, ChevronRight, Cpu, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface AssetTableProps {
  assets: Asset[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  search: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onPageChange: (p: number) => void;
}

const STATUS_OPTIONS = ["", "operational", "maintenance", "offline", "critical"];

export function AssetTable({
  assets, total, page, pageSize, isLoading,
  search, statusFilter, onSearchChange, onStatusFilterChange, onPageChange,
}: AssetTableProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) return <LoadingState variant="page" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={<Cpu className="h-12 w-12" />}
          title={search || statusFilter ? "No matching assets" : "No assets registered"}
          description={search || statusFilter ? "Try a different search or filter." : "Add your first asset to start monitoring."}
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <div className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
              <div>Name</div>
              <div>Type</div>
              <div>Status</div>
              <div>Location</div>
              <div />
            </div>
            <div className="divide-y">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="grid grid-cols-[1fr_100px_100px_100px_80px] gap-4 px-4 py-3 text-sm items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="font-medium truncate">{asset.name}</div>
                  <div className="text-muted-foreground">{asset.type}</div>
                  <div><StatusBadge status={asset.status} /></div>
                  <div className="text-muted-foreground truncate">{asset.location ?? "—"}</div>
                  <div>
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/assets/${asset.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[4rem] text-center">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
