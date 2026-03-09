"use client";

import { useEffect, useState, useRef, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Phone, CreditCard, CheckCircle, ArrowUp, Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PLANS, type PlanId } from "@/lib/plans";

interface UserSettings {
  name: string;
  email: string;
  phone: string | null;
  smsAlertsEnabled: boolean;
  plan: string;
  siteCount: number;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const isUpgrade = searchParams.get("upgrade") === "true";
  const planRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [phone, setPhone] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [testError, setTestError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
          setPhone(data.phone || "");
          setSmsEnabled(data.smsAlertsEnabled);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (isUpgrade && !loading && planRef.current) {
      planRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isUpgrade, loading]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, smsAlertsEnabled: smsEnabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save.");
      } else {
        const data = await res.json();
        setSettings(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTestSms() {
    setTestStatus("sending");
    setTestError("");

    try {
      const res = await fetch("/api/settings/test-sms", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setTestStatus("sent");
        setTimeout(() => setTestStatus("idle"), 5000);
      } else {
        setTestStatus("error");
        setTestError(data.error || "Failed to send test SMS.");
        setTimeout(() => setTestStatus("idle"), 5000);
      }
    } catch {
      setTestStatus("error");
      setTestError("Something went wrong.");
      setTimeout(() => setTestStatus("idle"), 5000);
    }
  }

  async function handlePlanChange(plan: PlanId) {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      setError("Failed to update plan.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) return null;

  const currentPlan = PLANS[settings.plan as PlanId] || PLANS.free;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account and alert preferences
        </p>
      </div>

      {isUpgrade && (
        <div className="mb-6 p-4 rounded-lg border border-primary/30 bg-primary/5 flex items-start gap-3">
          <ArrowUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">
              {"You've reached the site limit on your current plan"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Upgrade your plan below to monitor more websites and unlock additional features.
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Alert Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={settings.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={settings.email} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (for SMS alerts)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +1 for US)
                </p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="sms-toggle" className="cursor-pointer">SMS Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receive text messages when your sites go down
                  </p>
                </div>
                <button
                  id="sms-toggle"
                  type="button"
                  role="switch"
                  aria-checked={smsEnabled}
                  onClick={() => setSmsEnabled(!smsEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    smsEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      smsEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-success" />
                  ) : null}
                  {saved ? "Saved!" : "Save Changes"}
                </Button>

                {settings.phone && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={testStatus === "sending"}
                    onClick={handleTestSms}
                  >
                    {testStatus === "sending" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : testStatus === "sent" ? (
                      <CheckCircle className="mr-2 h-4 w-4 text-success" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {testStatus === "sent" ? "Sent!" : testStatus === "sending" ? "Sending..." : "Send Test SMS"}
                  </Button>
                )}
              </div>
              {testStatus === "error" && (
                <p className="text-sm text-destructive">{testError}</p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Plan */}
        <div ref={planRef}>
          <Card className={isUpgrade ? "ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Your Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold">{currentPlan.name}</span>
                  <Badge variant="outline">Current</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {settings.siteCount} / {currentPlan.maxSites} sites used
                </p>
                <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (settings.siteCount / currentPlan.maxSites) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3 mt-6">
                {(
                  Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]
                ).map(([id, plan]) => (
                  <div
                    key={id}
                    className={`p-3 rounded-lg border ${
                      settings.plan === id
                        ? "border-primary bg-primary/5"
                        : isUpgrade && id !== settings.plan
                        ? "border-primary/40 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{plan.name}</span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          ${plan.price}
                          {plan.price > 0 ? `/${plan.interval}` : ""}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Up to {plan.maxSites} sites
                        </p>
                      </div>
                      {settings.plan === id ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant={isUpgrade ? "default" : "outline"}
                          onClick={() => handlePlanChange(id)}
                        >
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Stripe integration coming soon. Plan changes are instant for the
                MVP.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
