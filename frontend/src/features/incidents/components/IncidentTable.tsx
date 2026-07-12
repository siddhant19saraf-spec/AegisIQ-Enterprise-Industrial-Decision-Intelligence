import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingState } from "@/components/layout/LoadingState";
import { EmptyState } from "@/components/layout/EmptyState";
import type { Incident } from "@/types";
import { Search, ChevronLeft, ChevronRight, AlertTriangle, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface IncidentTableProps {
  incidents: Incident[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  search: string;
  statusFilter: string;
  severityFilter: string;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onSeverityFilterChange: (v: string) => void;
  onPageChange: (p: number) => void;
}

const STATUSES = ["", "open", "investigating", "resolved", "closed"];
const SEVERITIES = ["", "critical", "high", "medium", "low"];

export function IncidentTable({
  incidents, total, page, pageSize, isLoading,
  search, statusFilter, severityFilter,
  onSearchChange, onStatusFilterChange, onSeverityFilterChange, onPageChange,
}: IncidentTableProps) {
  const router = useRouter();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (isLoading) return <LoadingState variant="page" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
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
            {STATUSES.filter(Boolean).map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={onSeverityFilterChange}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {SEVERITIES.filter(Boolean).map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {incidents.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title={search || statusFilter !== "all" || severityFilter !== "all" ? "No matching incidents" : "No incidents reported"}
          description={search || statusFilter !== "all" || severityFilter !== "all" ? "Try a different search or filter." : "All systems are operating normally."}
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <div className="grid grid-cols-[1fr_90px_100px_100px_80px] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
              <div>Title</div>
              <div>Severity</div>
              <div>Status</div>
              <div>Risk</div>
              <div />
            </div>
            <div className="divide-y">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="grid grid-cols-[1fr_90px_100px_100px_80px] gap-4 px-4 py-3 text-sm items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="font-medium truncate">{inc.title}</div>
                  <div><StatusBadge status={inc.severity} /></div>
                  <div><StatusBadge status={inc.status} /></div>
                  <div className="text-muted-foreground">{inc.risk_score != null ? (inc.risk_score * 100).toFixed(0) + "%" : "—"}</div>
                  <div>
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/incidents/${inc.id}`)}>
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
