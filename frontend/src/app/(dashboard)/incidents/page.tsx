"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { IncidentCards } from "@/features/incidents/components/IncidentCards";
import { IncidentTable } from "@/features/incidents/components/IncidentTable";
import { IncidentForm } from "@/features/incidents/components/IncidentForm";
import { useIncidents, useCreateIncident } from "@/features/incidents/hooks/useIncidents";
import { useDebounce } from "@/lib/hooks/useDebounce";

export default function IncidentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const filters = {
    page,
    page_size: 20,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(severityFilter && severityFilter !== "all" ? { severity: severityFilter } : {}),
  };

  const { data, isLoading } = useIncidents(filters);
  const createIncident = useCreateIncident();

  const items = data?.items ?? [];
  const stats = {
    total: data?.total ?? 0,
    open: items.filter((i) => i.status === "open").length,
    investigating: items.filter((i) => i.status === "investigating").length,
    resolved: items.filter((i) => i.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidents"
        description="Track, investigate, and resolve operational incidents"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Report Incident
          </Button>
        }
      />
      <IncidentCards {...stats} />
      <IncidentTable
        incidents={items}
        total={data?.total ?? 0}
        page={page}
        pageSize={20}
        isLoading={isLoading}
        search={search}
        statusFilter={statusFilter}
        severityFilter={severityFilter}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
        onSeverityFilterChange={(v) => { setSeverityFilter(v); setPage(1); }}
        onPageChange={setPage}
      />
      <IncidentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(data) => {
          createIncident.mutate(data);
          setFormOpen(false);
        }}
      />
    </div>
  );
}
