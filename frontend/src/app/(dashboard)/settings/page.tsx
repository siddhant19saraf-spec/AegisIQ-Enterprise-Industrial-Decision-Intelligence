"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/AuthContext";
import { User, Bell, Shield } from "lucide-react";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "Demo User");
  const [email, setEmail] = useState(user?.email || "demo@aegisiq.io");
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    criticalAlerts: true,
    maintenanceReminders: true,
    reportCompletions: true,
    emailDigest: false,
    darkMode: true,
    compactView: false,
    autoRefresh: true,
    auditLogging: true,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and system preferences" />

      <Tabs defaultValue="profile" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="profile"><User className="mr-1 h-3 w-3" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1 h-3 w-3" /> Alerts</TabsTrigger>
          <TabsTrigger value="system"><Shield className="mr-1 h-3 w-3" /> System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input value={user?.role || "admin"} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <div className="flex items-center gap-2 h-10">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
                {saved ? "Saved!" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alert Preferences</CardTitle>
              <CardDescription>Configure what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { key: "criticalAlerts" as const, label: "Critical incident alerts", desc: "Push and email for critical/high severity incidents" },
                { key: "maintenanceReminders" as const, label: "Maintenance reminders", desc: "24 hours before scheduled maintenance windows" },
                { key: "reportCompletions" as const, label: "Report completions", desc: "When a scheduled report finishes generating" },
                { key: "emailDigest" as const, label: "Daily email digest", desc: "Summary of all activity sent to your inbox" },
              ].map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
                  </div>
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Preferences</CardTitle>
              <CardDescription>Customize the application behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { key: "darkMode" as const, label: "Dark mode", desc: "Use dark color theme across the interface" },
                { key: "compactView" as const, label: "Compact view", desc: "Reduce spacing for denser information display" },
                { key: "autoRefresh" as const, label: "Auto-refresh dashboard", desc: "Automatically refresh data every 30 seconds" },
                { key: "auditLogging" as const, label: "Audit logging", desc: "Log all user actions for compliance tracking" },
              ].map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
                  </div>
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-mono">0.1.0-rc1</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Environment</span><span className="font-mono">Development</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span className="font-mono">SQLite</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">API Status</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Online</span></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
