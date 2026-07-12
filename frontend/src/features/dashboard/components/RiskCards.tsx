import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { motion } from "framer-motion";

interface RiskCardsProps {
  assetsByStatus: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
}

export function RiskCards({ assetsByStatus, incidentsBySeverity }: RiskCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid gap-4 md:grid-cols-2"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(assetsByStatus).length === 0 ? (
            <p className="text-sm text-muted-foreground">No asset data</p>
          ) : (
            Object.entries(assetsByStatus).map(([status, count]) => {
              const total = Object.values(assetsByStatus).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const barColor =
                status === "critical" ? "bg-red-500" :
                status === "maintenance" ? "bg-amber-500" :
                status === "offline" ? "bg-gray-500" :
                "bg-emerald-500";
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <StatusBadge status={status} />
                    <span className="font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incident Risk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(incidentsBySeverity).length === 0 ? (
            <p className="text-sm text-muted-foreground">No incident data</p>
          ) : (
            Object.entries(incidentsBySeverity).map(([severity, count]) => {
              const total = Object.values(incidentsBySeverity).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const barColor =
                severity === "critical" ? "bg-red-500" :
                severity === "high" ? "bg-orange-500" :
                severity === "medium" ? "bg-amber-500" :
                "bg-blue-500";
              return (
                <div key={severity} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <StatusBadge status={severity} />
                    <span className="font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
