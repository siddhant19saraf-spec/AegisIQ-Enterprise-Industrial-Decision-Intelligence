import { cn } from "@/lib/utils";

type StatusVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

const statusStyles: Record<string, StatusVariant> = {
  operational: "success",
  maintenance: "warning",
  offline: "destructive",
  critical: "destructive",
  open: "destructive",
  investigating: "warning",
  resolved: "success",
  closed: "secondary",
  active: "success",
  pending: "warning",
  healthy: "success",
  degraded: "warning",
  down: "destructive",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusStyles[status.toLowerCase()] ?? "secondary";

  const variantClasses: Record<StatusVariant, string> = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-muted text-muted-foreground border-transparent",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    outline: "border border-border text-muted-foreground",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30",
    warning: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full bg-current")} />
      {status}
    </span>
  );
}
