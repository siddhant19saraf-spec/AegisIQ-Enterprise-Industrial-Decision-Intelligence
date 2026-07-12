"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { emergencyApi } from "@/features/emergency/api/emergency";
import { Button } from "@/components/ui/button";

export function SOSButton() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSOS = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await emergencyApi.sendSOS({ description: "Emergency SOS from dashboard" });
      setResult(`🚨 एम्बुलेंस {res.ambulance_eta} मिनट में पहुंचेगी | Ambulance ETA: ${res.ambulance_eta} min`);
    } catch {
      setResult("Failed to send SOS. Try calling 108/102 immediately.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating SOS button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 active:scale-95 transition-all animate-pulse-slow"
        title="SOS Emergency"
      >
        <AlertTriangle className="h-6 w-6" />
      </button>

      {/* SOS Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-xl border-2 border-red-500 bg-card shadow-2xl">
          <div className="flex items-center justify-between bg-red-600 px-4 py-3 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">SOS Emergency</span>
            </div>
            <button onClick={() => { setOpen(false); setResult(null); }}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 space-y-3">
            {result ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm">{result}</div>
                <Button variant="outline" className="w-full" onClick={() => { setOpen(false); setResult(null); }}>Close</Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Press the button below to trigger an immediate emergency alert. Ambulance will be dispatched to your location.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSOS}
                    disabled={sending}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-lg h-12"
                  >
                    {sending ? "SENDING..." : "🚨 SOS"}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>राष्ट्रीय आपातकालीन सेवा | National Emergency Services</p>
                  <p className="font-mono text-red-600">🚑 108 | 102 | 112</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
