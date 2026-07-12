import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, AlertTriangle, Wrench, PowerOff } from "lucide-react";

interface AssetCardsProps {
  total: number;
  operational: number;
  maintenance: number;
  offline: number;
  critical?: number;
}

export function AssetCards({ total, operational, maintenance, offline }: AssetCardsProps) {
  const cards = [
    { label: "Total Assets", value: total, icon: Cpu, color: "text-blue-600 dark:text-blue-400" },
    { label: "Operational", value: operational, icon: AlertTriangle, color: "text-emerald-600 dark:text-emerald-400" },
    { label: "Maintenance", value: maintenance, icon: Wrench, color: "text-amber-600 dark:text-amber-400" },
    { label: "Offline", value: offline, icon: PowerOff, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
