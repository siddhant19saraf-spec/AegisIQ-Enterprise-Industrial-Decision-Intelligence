import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, AlertTriangle, Activity, FileText, TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardSummary } from "@/types";
import { motion } from "framer-motion";

interface KPICardsProps {
  data: DashboardSummary;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function KPICards({ data }: KPICardsProps) {
  const cards = [
    { label: "Total Assets", value: data.total_assets, icon: Cpu, change: `${data.critical_assets} critical`, trend: "up" as const, color: "text-blue-600 dark:text-blue-400" },
    { label: "Active Incidents", value: data.active_incidents, icon: AlertTriangle, change: `${data.incidents_today} today`, trend: data.active_incidents > 0 ? "up" as const : "down" as const, color: "text-red-600 dark:text-red-400" },
    { label: "Uptime Rate", value: `${data.uptime_rate}%`, icon: Activity, change: "Last 30 days", trend: "up" as const, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Open Reports", value: data.open_reports, icon: FileText, change: "Pending review", trend: "down" as const, color: "text-amber-600 dark:text-amber-400" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.label} variants={item}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  {card.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  {card.change}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
