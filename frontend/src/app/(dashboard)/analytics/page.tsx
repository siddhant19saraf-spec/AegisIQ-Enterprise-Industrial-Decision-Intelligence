import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance trends, predictive insights, and operational metrics"
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Asset Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center text-sm text-muted-foreground">
            Chart visualization coming in a future milestone
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Uptime (30d)", value: "98.7%" },
              { label: "Avg Response Time", value: "4.2m" },
              { label: "Incidents (30d)", value: "12" },
              { label: "Resolved Rate", value: "91.6%" },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{m.label}</span>
                <span className="text-sm font-semibold">{m.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
