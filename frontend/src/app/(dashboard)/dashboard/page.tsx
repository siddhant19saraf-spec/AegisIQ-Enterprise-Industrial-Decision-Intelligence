"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/layout/LoadingState";
import { EmptyState } from "@/components/layout/EmptyState";
import { KPICards } from "@/features/dashboard/components/KPICards";
import { RiskCards } from "@/features/dashboard/components/RiskCards";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ClipboardList, LayoutDashboard } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#6b7280", "#ef4444"];
const SEV_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#3b82f6"];

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) return <LoadingState variant="page" />;
  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Real-time overview of your industrial operations" />
        <EmptyState
          icon={<LayoutDashboard className="h-12 w-12" />}
          title="Unable to load dashboard"
          description="Check your connection or try again later."
        />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Real-time overview of your industrial operations" />
        <EmptyState
          icon={<LayoutDashboard className="h-12 w-12" />}
          title="No data yet"
          description="Add assets and incidents to see your dashboard."
        />
      </div>
    );
  }

  const assetPie = Object.entries(data.assets_by_status).map(([name, value]) => ({ name, value }));
  const sevBar = Object.entries(data.incidents_by_severity).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your industrial operations"
      />
      <KPICards data={data} />
      <RiskCards
        assetsByStatus={data.assets_by_status}
        incidentsBySeverity={data.incidents_by_severity}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Asset Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assetPie.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No assets</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={assetPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {assetPie.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Incidents by Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sevBar.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No incidents</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sevBar}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {sevBar.map((_, i) => (
                      <Cell key={i} fill={SEV_COLORS[i % SEV_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
