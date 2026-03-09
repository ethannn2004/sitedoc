"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  ExternalLink,
  RefreshCw,
  Loader2,
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

interface Incident {
  id: string;
  type: string;
  diagnosis: string;
  startedAt: string;
  resolvedAt: string | null;
  site: { label: string; url: string };
}

interface DashboardData {
  sites: Site[];
  incidents: Incident[];
  stats: {
    total: number;
    online: number;
    down: number;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data?.stats || { total: 0, online: 0, down: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your monitored sites
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/dashboard/sites/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sites</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-success">{stats.online}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Down</p>
              <p className="text-2xl font-bold text-destructive">
                {stats.down}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Sites List */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monitored Sites</CardTitle>
            <Link
              href="/dashboard/sites"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!data?.sites?.length ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No sites being monitored yet.
              </p>
              <Link href="/dashboard/sites/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Site
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.sites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-border/50 hover:border-border transition-colors"
                >
                  <div
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      site.status === "online"
                        ? "bg-success"
                        : site.status === "unknown"
                        ? "bg-muted-foreground"
                        : "bg-destructive animate-pulse"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">
                        {site.label}
                      </p>
                      <StatusBadge status={site.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {site.url}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {formatResponseTime(site.responseTimeMs)}
                    </div>
                    <span className="text-xs">
                      {formatDate(site.lastCheckedAt)}
                    </span>
                  </div>
                  <Link href={`/dashboard/sites/${site.id}`}>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Incidents</CardTitle>
            <Link
              href="/dashboard/incidents"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {!data?.incidents?.length ? (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-success/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No incidents recorded. All clear!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.incidents.slice(0, 5).map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <div
                    className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                      incident.resolvedAt ? "bg-success" : "bg-destructive animate-pulse"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">
                        {incident.site.label}
                      </p>
                      <StatusBadge status={incident.type} />
                      {incident.resolvedAt && (
                        <span className="text-xs text-success">Resolved</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {incident.diagnosis}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDate(incident.startedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
