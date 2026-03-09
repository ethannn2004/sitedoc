"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2, Zap, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface CheckResultItem {
  id: string;
  status: string;
  statusCode: number | null;
  responseTimeMs: number;
  errorCode: string | null;
  errorMessage: string | null;
  checkedAt: string;
}

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [history, setHistory] = useState<CheckResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  async function loadSite() {
    setLoading(true);
    try {
      const [siteRes, historyRes] = await Promise.all([
        fetch(`/api/sites/${id}`),
        fetch(`/api/sites/${id}/history`),
      ]);
      if (siteRes.ok) {
        const s = await siteRes.json();
        setSite(s);
        setLabel(s.label);
        setUrl(s.url);
      }
      if (historyRes.ok) {
        setHistory(await historyRes.json());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update.");
      } else {
        setSite(data);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this site?")) return;
    const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/sites");
  }

  async function checkNow() {
    setChecking(true);
    try {
      const res = await fetch(`/api/sites/${id}/check`, { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setSite((s) => (s ? { ...s, ...updated } : s));
        loadSite();
      }
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadSite();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Site not found.</p>
        <Link href="/dashboard/sites">
          <Button variant="outline" className="mt-4">
            Back to Sites
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/sites"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{site.label}</h1>
          <StatusBadge status={site.status} />
        </div>
        <p className="text-muted-foreground text-sm mt-1">{site.url}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={checkNow}
                  disabled={checking}
                >
                  {checking ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Check Now
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-4 w-4 rounded-full ${
                    site.status === "online"
                      ? "bg-success"
                      : site.status === "unknown"
                      ? "bg-muted-foreground"
                      : "bg-destructive animate-pulse"
                  }`}
                />
                <span className="text-lg font-medium capitalize">
                  {site.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Response Time
                  </p>
                  <p className="font-semibold">
                    {formatResponseTime(site.responseTimeMs)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Last Checked
                  </p>
                  <p className="font-semibold text-sm">
                    {formatDate(site.lastCheckedAt)}
                  </p>
                </div>
              </div>

              {site.lastDiagnosis && site.status !== "online" && (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/10">
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
          </CardContent>
        </Card>
      </div>

      {/* Check History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Check History</CardTitle>
        </CardHeader>
        <CardContent>
          {!history.length ? (
            <p className="text-muted-foreground text-sm text-center py-6">
              No checks recorded yet. Click &quot;Check Now&quot; to run the first check.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 text-sm"
                >
                  <div
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      check.status === "online"
                        ? "bg-success"
                        : "bg-destructive"
                    }`}
                  />
                  <StatusBadge status={check.status} />
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {check.responseTimeMs}ms
                  </span>
                  {check.statusCode && (
                    <span className="text-muted-foreground">
                      HTTP {check.statusCode}
                    </span>
                  )}
                  {check.errorMessage && (
                    <span className="text-destructive/80 truncate flex-1">
                      {check.errorMessage}
                    </span>
                  )}
                  <span className="text-muted-foreground/60 text-xs ml-auto shrink-0">
                    {formatDate(check.checkedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
