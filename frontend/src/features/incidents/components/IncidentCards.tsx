import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from "lucide-react";

interface IncidentCardsProps {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
}

export function IncidentCards({ total, open, investigating, resolved }: IncidentCardsProps) {
  const cards = [
    { label: "Total Incidents", value: total, icon: AlertTriangle, color: "text-blue-600 dark:text-blue-400" },
    { label: "Open", value: open, icon: AlertCircle, color: "text-red-600 dark:text-red-400" },
    { label: "Investigating", value: investigating, icon: Info, color: "text-amber-600 dark:text-amber-400" },
    { label: "Resolved", value: resolved, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
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
