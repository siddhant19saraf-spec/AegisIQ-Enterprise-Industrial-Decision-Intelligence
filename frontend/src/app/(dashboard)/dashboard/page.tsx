import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { Cpu, AlertTriangle, Activity, FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";

const kpis = [
  { label: "Total Assets", value: "1,284", icon: Cpu, change: "+12 this month", trend: "up" },
  { label: "Active Incidents", value: "14", icon: AlertTriangle, change: "-3 from yesterday", trend: "down" },
  { label: "Uptime Rate", value: "98.7%", icon: Activity, change: "+0.2% this week", trend: "up" },
  { label: "Open Reports", value: "8", icon: FileText, change: "2 due today", trend: "up" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your industrial operations"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  {kpi.trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  {kpi.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            Activity feed will appear here once data is connected
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { action: "Review Incident #1042", due: "2 hours ago" },
              { action: "Approve maintenance report", due: "Yesterday" },
              { action: "Update asset Turbine #7", due: "2 days ago" },
            ].map((item) => (
              <div key={item.action} className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm">{item.action}</span>
                <span className="text-xs text-muted-foreground">{item.due}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
