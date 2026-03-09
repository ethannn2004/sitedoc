"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Plus,
  Clock,
  Trash2,
  Pencil,
  Zap,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatResponseTime } from "@/lib/utils";

interface Site {
  id: string;
  url: string;
  label: string;
  status: string;
  responseTimeMs: number | null;
  lastCheckedAt: string | null;
  lastDiagnosis: string | null;
  lastSuggestion: string | null;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);

  async function loadSites() {
    setLoading(true);
    try {
      const res = await fetch("/api/sites");
      if (res.ok) setSites(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function deleteSite(id: string) {
    if (!confirm("Are you sure you want to remove this site?")) return;
    const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
    if (res.ok) setSites(sites.filter((s) => s.id !== id));
  }

  async function checkNow(id: string) {
    setChecking(id);
    try {
      const res = await fetch(`/api/sites/${id}/check`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setSites(sites.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      }
    } finally {
      setChecking(null);
    }
  }

  useEffect(() => {
    loadSites();

    // Auto-refresh site statuses every 30 seconds
    const interval = setInterval(() => {
      loadSites();
    }, 30000);

    return () => clearInterval(interval);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Monitored Sites</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your monitored websites
          </p>
        </div>
        <Link href="/dashboard/sites/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </Link>
      </div>

      {!sites.length ? (
        <Card>
          <div className="text-center py-16">
            <Globe className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No sites yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Add your first website to start monitoring its uptime and
              receive alerts when it goes down.
            </p>
            <Link href="/dashboard/sites/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Site
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {sites.map((site) => (
            <Card key={site.id} className="p-0 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${
                        site.status === "online"
                          ? "bg-success"
                          : site.status === "unknown"
                          ? "bg-muted-foreground"
                          : "bg-destructive animate-pulse"
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{site.label}</h3>
                        <StatusBadge status={site.status} />
                      </div>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-0.5"
                      >
                        {site.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatResponseTime(site.responseTimeMs)}
                        </span>
                        <span>
                          Last checked: {formatDate(site.lastCheckedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => checkNow(site.id)}
                      disabled={checking === site.id}
                    >
                      {checking === site.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/dashboard/sites/${site.id}`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteSite(site.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Diagnosis info when site is down */}
                {site.status !== "online" &&
                  site.status !== "unknown" &&
                  site.lastDiagnosis && (
                    <div className="mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                      <p className="text-sm font-medium text-destructive mb-1">
                        Diagnosis
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {site.lastDiagnosis}
                      </p>
                      {site.lastSuggestion && (
                        <>
                          <p className="text-sm font-medium text-warning mt-2 mb-1">
                            Suggested Fix
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {site.lastSuggestion}
                          </p>
                        </>
                      )}
                    </div>
                  )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
