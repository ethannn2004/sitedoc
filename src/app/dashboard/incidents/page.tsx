"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

interface Incident {
  id: string;
  type: string;
  diagnosis: string;
  suggestedFix: string;
  startedAt: string;
  resolvedAt: string | null;
  site: { label: string; url: string };
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/incidents");
        if (res.ok) setIncidents(await res.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Incidents</h1>
        <p className="text-muted-foreground text-sm mt-1">
          History of outages and issues detected
        </p>
      </div>

      {!incidents.length ? (
        <Card>
          <div className="text-center py-16">
            <CheckCircle className="h-14 w-14 text-success/20 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No incidents</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              No outages have been detected yet. Your sites are looking good!
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Card key={incident.id} className="p-0 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-3 w-3 rounded-full mt-1 shrink-0 ${
                        incident.resolvedAt
                          ? "bg-success"
                          : "bg-destructive animate-pulse"
                      }`}
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold">
                          {incident.site.label}
                        </h3>
                        <StatusBadge status={incident.type} />
                        {incident.resolvedAt ? (
                          <span className="text-xs text-success font-medium">
                            Resolved
                          </span>
                        ) : (
                          <span className="text-xs text-destructive font-medium">
                            Ongoing
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {incident.site.url}
                      </p>

                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-sm font-medium text-destructive">
                            Diagnosis
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {incident.diagnosis}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-warning">
                            Suggested Fix
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {incident.suggestedFix}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/60">
                        <span>Started: {formatDate(incident.startedAt)}</span>
                        {incident.resolvedAt && (
                          <span>
                            Resolved: {formatDate(incident.resolvedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
