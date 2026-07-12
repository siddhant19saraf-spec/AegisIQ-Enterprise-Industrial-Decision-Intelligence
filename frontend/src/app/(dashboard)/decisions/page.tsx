"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Lightbulb, AlertTriangle, CheckCircle, ArrowRight, Shield,
  TrendingUp,
} from "lucide-react";
import { decisionsApi } from "@/features/decisions/api/decisions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const RISK_COLORS: Record<string, string> = {
  critical: "text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20",
  high: "text-orange-500 border-orange-200 bg-orange-50 dark:bg-orange-950/20",
  medium: "text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-950/20",
  low: "text-emerald-500 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20",
};

const CONFIDENCE_COLOR = (v: number) => v >= 0.8 ? "text-emerald-500" : v >= 0.6 ? "text-amber-500" : "text-red-500";

export default function DecisionIntelligencePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["decisions", "recommendations"],
    queryFn: decisionsApi.getRecommendations,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Decision Intelligence</h1>
          <p className="text-sm text-muted-foreground">Explainable recommendations powered by enterprise data</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-6"><Skeleton className="h-32" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Decision Intelligence</h1>
          <p className="text-sm text-muted-foreground">Explainable recommendations powered by enterprise data</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
              <p className="text-sm text-muted-foreground">Could not load recommendations. Ensure the backend is running and has data.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recs = data?.recommendations ?? [];
  const critical = recs.filter((r) => r.risk_level === "critical").length;
  const high = recs.filter((r) => r.risk_level === "high").length;
  const avgConfidence = recs.length > 0 ? recs.reduce((s, r) => s + r.confidence, 0) / recs.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Decision Intelligence</h1>
        <p className="text-sm text-muted-foreground">Explainable recommendations powered by enterprise data</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Recommendations</CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{recs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-500">{critical}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-500">{high}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgConfidence * 100).toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {recs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <CheckCircle className="h-10 w-10 text-emerald-500 mb-3" />
              <p className="text-sm font-medium">No recommendations needed</p>
              <p className="text-xs text-muted-foreground mt-1">All assets are in good health</p>
            </CardContent>
          </Card>
        ) : (
          recs.map((rec) => (
            <Card key={rec.asset_id} className={cn("border-l-4", rec.risk_level === "critical" ? "border-l-red-500" : rec.risk_level === "high" ? "border-l-orange-500" : rec.risk_level === "medium" ? "border-l-amber-500" : "border-l-emerald-500")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{rec.asset_name}</h3>
                      <Badge variant="outline" className="text-[10px]">{rec.asset_type}</Badge>
                      <Badge className={cn("text-[10px]", RISK_COLORS[rec.risk_level])}>
                        {rec.risk_level.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm">{rec.summary}</p>
                    <p className="mt-1.5 text-sm text-muted-foreground">{rec.explanation}</p>

                    <div className="mt-3 space-y-2">
                      {rec.evidence.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Evidence</p>
                          <ul className="space-y-0.5">
                            {rec.evidence.map((e, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                                {e}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rec.recommended_actions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Recommended Actions</p>
                          <ul className="space-y-0.5">
                            {rec.recommended_actions.map((a, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs">
                                <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="relative h-14 w-14">
                      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="3" />
                        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3"
                          strokeDasharray={`${rec.confidence * 100} ${100 - rec.confidence * 100}`}
                          className={CONFIDENCE_COLOR(rec.confidence)}
                          strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                        {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Confidence</span>

                    <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", RISK_COLORS[rec.risk_level])}>
                      <span>Risk: {(rec.risk_score * 100).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
