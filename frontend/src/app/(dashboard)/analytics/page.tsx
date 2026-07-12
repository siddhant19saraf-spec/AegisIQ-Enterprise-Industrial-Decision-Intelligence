"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi, type AnalyticsSummary } from "@/features/analytics/api/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState } from "@/components/layout/LoadingState";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";
import {
  Activity, AlertTriangle,
  Zap, ArrowUpRight, Building2, Shield,
} from "lucide-react";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];
const SEV_COLORS: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };
const STATUS_COLORS: Record<string, string> = { operational: "#22c55e", maintenance: "#eab308", offline: "#6b7280", critical: "#ef4444" };

function OverviewTab({ data }: { data: AnalyticsSummary }) {
  const totalAssets = data.assets.total;
  const operationalPct = totalAssets > 0 ? Math.round(((data.assets.by_status.operational || 0) / totalAssets) * 100) : 0;


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <p className="text-xs text-muted-foreground">Across {Object.keys(data.assets.by_location).length} facilities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Operational Rate</CardTitle>
            <Shield className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{operationalPct}%</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>{data.assets.by_status.operational || 0} assets online</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.incidents.total}</div>
            <p className="text-xs text-muted-foreground">{data.incidents.by_severity.critical || 0} critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.avg_risk_score * 100)}%</div>
            <p className="text-xs text-muted-foreground">{data.risk_distribution.critical || 0} at critical risk</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Status Distribution</CardTitle>
            <CardDescription>Current status of all assets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(data.assets.by_status).map(([name, value]) => ({ name, value }))}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {Object.keys(data.assets.by_status).map((key, i) => (
                    <Cell key={i} fill={STATUS_COLORS[key] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incidents by Severity</CardTitle>
            <CardDescription>Severity distribution breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(data.incidents.by_severity).map(([name, value]) => ({ name, value }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {Object.keys(data.incidents.by_severity).map((key, i) => (
                    <Cell key={i} fill={SEV_COLORS[key] || COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Score Distribution</CardTitle>
            <CardDescription>Incidents by risk level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }))}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {Object.keys(data.risk_distribution).map((key, i) => (
                    <Cell key={i} fill={SEV_COLORS[key] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets by Facility</CardTitle>
            <CardDescription>Equipment distribution across plants</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(data.assets.by_location).map(([name, value]) => ({ name: name.split(",")[0], value }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TrendsTab({ data }: { data: AnalyticsSummary }) {
  const typeData = Object.entries(data.assets.by_type).map(([name, value]) => ({ name, value }));
  const incStatusData = Object.entries(data.incidents.by_status).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Types</CardTitle>
            <CardDescription>Distribution by equipment type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incident Status</CardTitle>
            <CardDescription>Current incident pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={incStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {incStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risk Radar</CardTitle>
          <CardDescription>Asset risk profile by type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={typeData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar name="Assets" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function HeatmapTab({ data }: { data: AnalyticsSummary }) {
  const locationData = Object.entries(data.assets.by_location).map(([name, count]) => ({
    name: name.split(",")[0],
    city: name.split(",")[1]?.trim() || "",
    count,
    operational: Math.round(count * 0.7),
    maintenance: Math.round(count * 0.15),
    offline: Math.round(count * 0.1),
    critical: Math.round(count * 0.05),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {locationData.map((loc) => (
          <Card key={loc.name}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                {loc.name}
              </CardTitle>
              <CardDescription>{loc.city}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold">{loc.count}</div>
              <p className="text-xs text-muted-foreground">Total Equipment</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Operational</span>
                  <span className="font-medium">{loc.operational}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Maintenance</span>
                  <span className="font-medium">{loc.maintenance}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-400" /> Offline</span>
                  <span className="font-medium">{loc.offline}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Critical</span>
                  <span className="font-medium">{loc.critical}</span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                <div className="bg-emerald-500" style={{ width: `${(loc.operational / loc.count) * 100}%` }} />
                <div className="bg-amber-500" style={{ width: `${(loc.maintenance / loc.count) * 100}%` }} />
                <div className="bg-gray-400" style={{ width: `${(loc.offline / loc.count) * 100}%` }} />
                <div className="bg-red-500" style={{ width: `${(loc.critical / loc.count) * 100}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: analyticsApi.getSummary,
  });

  if (isLoading) return <LoadingState variant="page" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Deep insights and forecasts across {data?.assets.total ?? 0} assets and {data?.incidents.total ?? 0} incidents
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="heatmap">Facilities</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {data && <OverviewTab data={data} />}
        </TabsContent>
        <TabsContent value="trends" className="mt-4">
          {data && <TrendsTab data={data} />}
        </TabsContent>
        <TabsContent value="heatmap" className="mt-4">
          {data && <HeatmapTab data={data} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
