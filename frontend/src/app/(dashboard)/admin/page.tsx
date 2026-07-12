"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Users, Database, Activity, Server,
  RefreshCw, CheckCircle2, XCircle, Loader2, Cpu, HardDrive,
} from "lucide-react";
import { api } from "@/lib/api";

interface HealthStatus {
  status: string;
  version: string;
  environment: string;
}

interface AnalyticsSummary {
  assets_by_status: Record<string, number>;
  assets_by_type: Record<string, number>;
  assets_by_facility: Record<string, number>;
  incidents_by_severity: Record<string, number>;
  incidents_by_status: Record<string, number>;
  total_assets: number;
  total_incidents: number;
  avg_risk_score: number;
}

const DEMO_USERS = [
  { id: "1", name: "Admin User", email: "admin@aegisiq.com", role: "admin", is_active: true, last_login: "2026-07-12T10:00:00Z" },
  { id: "2", name: "Priya Patel", email: "priya@aegisiq.com", role: "safety_officer", is_active: true, last_login: "2026-07-12T09:30:00Z" },
  { id: "3", name: "Rajesh Kumar", email: "rajesh@aegisiq.com", role: "operator", is_active: true, last_login: "2026-07-11T14:20:00Z" },
  { id: "4", name: "Amit Singh", email: "amit@aegisiq.com", role: "engineer", is_active: true, last_login: "2026-07-10T08:45:00Z" },
  { id: "5", name: "Sunita Verma", email: "sunita@aegisiq.com", role: "viewer", is_active: false, last_login: "2026-06-28T11:15:00Z" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-500",
  safety_officer: "bg-amber-500/10 text-amber-500",
  engineer: "bg-blue-500/10 text-blue-500",
  operator: "bg-emerald-500/10 text-emerald-500",
  viewer: "bg-gray-500/10 text-gray-500",
};

export default function AdminPage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<HealthStatus>("/health"),
  });

  const analytics = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => api.get<AnalyticsSummary>("/api/v1/analytics/summary"),
  });

  const h = health.data;
  const a = analytics.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">System administration and monitoring</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { health.refetch(); analytics.refetch(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                {health.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : h ? (
                  <div className="flex items-center gap-2">
                    {h.status === "ok" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-lg font-bold capitalize">{h.status}</span>
                    <Badge variant="outline" className="text-xs">{h.environment}</Badge>
                  </div>
                ) : (
                  <span className="text-destructive">Unreachable</span>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">SQLite</div>
                <p className="text-xs text-muted-foreground">aiosqlite — Embedded</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Version
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{h?.version ?? "—"}</div>
                <p className="text-xs text-muted-foreground">AegisIQ Platform</p>
              </CardContent>
            </Card>
          </div>

          {a && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Assets by Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(a.assets_by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{status}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex items-center justify-between font-medium">
                    <span className="text-sm">Total</span>
                    <Badge>{a.total_assets}</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Incidents by Severity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(a.incidents_by_severity).map(([sev, count]) => (
                    <div key={sev} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{sev}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex items-center justify-between font-medium">
                    <span className="text-sm">Total</span>
                    <Badge>{a.total_incidents}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b bg-muted/50 px-4 py-2.5 text-sm font-medium text-muted-foreground">
                  <div>Name</div>
                  <div>Email</div>
                  <div>Role</div>
                  <div className="w-20 text-right">Status</div>
                </div>
                {DEMO_USERS.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 border-b px-4 py-3 text-sm last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <div className="font-medium">{user.name}</div>
                    <div className="text-muted-foreground">{user.email}</div>
                    <div>
                      <Badge variant="secondary" className={`capitalize text-xs ${ROLE_COLORS[user.role] ?? ""}`}>
                        {user.role.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="w-20 text-right">
                      {user.is_active ? (
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Backend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Framework</span>
                  <span>FastAPI (async)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ORM</span>
                  <span>SQLAlchemy 2.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Database</span>
                  <span>SQLite + aiosqlite</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vector Store</span>
                  <span>Qdrant (in-memory fallback)</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Frontend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Framework</span>
                  <span>Next.js 15</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">UI</span>
                  <span>Radix UI + Tailwind</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">State</span>
                  <span>React Query (TanStack)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Charts</span>
                  <span>Recharts</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Authentication</span>
                <Badge variant="outline">JWT (access + refresh)</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CORS</span>
                <Badge variant="outline">Configurable origins</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rate Limiting</span>
                <Badge variant="outline">Trusted Host Middleware</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Audit Logging</span>
                <Badge variant="outline">Enabled</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
