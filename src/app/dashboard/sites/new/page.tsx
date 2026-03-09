"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewSitePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, label }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard/settings?upgrade=true");
          return;
        }
        setError(data.error || "Failed to add site.");
        setLoading(false);
        return;
      }

      // Auto-check the site immediately after adding
      try {
        await fetch(`/api/sites/${data.id}/check`, { method: "POST" });
      } catch {
        // Non-critical — site was added, check will happen on next cron
      }

      router.push("/dashboard/sites");
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold">Add a Site</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Enter the URL you want to monitor
        </p>
      </div>

      <Card className="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              placeholder="My Website"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              A friendly name for this site
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Include https:// for SSL monitoring
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Site
            </Button>
            <Link href="/dashboard/sites">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
