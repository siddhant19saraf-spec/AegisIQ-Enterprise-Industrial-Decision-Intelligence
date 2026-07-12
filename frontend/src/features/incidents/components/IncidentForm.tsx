import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Incident } from "@/types";
import { useEffect } from "react";

const incidentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().nullable().optional(),
  severity: z.enum(["critical", "high", "medium", "low"]),
  status: z.enum(["open", "investigating", "resolved", "closed"]),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

interface IncidentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IncidentFormValues) => void;
  incident?: Incident | null;
}

export function IncidentForm({ open, onOpenChange, onSubmit, incident }: IncidentFormProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { title: "", description: "", severity: "medium", status: "open" },
  });

  const severity = watch("severity");
  const status = watch("status");

  useEffect(() => {
    if (incident) {
      reset({
        title: incident.title,
        description: incident.description ?? "",
        severity: incident.severity,
        status: incident.status,
      });
    } else {
      reset({ title: "", description: "", severity: "medium", status: "open" });
    }
  }, [incident, reset, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{incident ? "Edit Incident" : "Report Incident"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} placeholder="e.g. Overheating detected" />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setValue("severity", v as IncidentFormValues["severity"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as IncidentFormValues["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} rows={3} placeholder="Optional description..." />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{incident ? "Save" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
