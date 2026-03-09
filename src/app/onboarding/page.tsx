"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Activity, Loader2, Phone, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState("");

  // Check if user is authenticated and hasn't already completed onboarding
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      // Check if onboarding is already completed
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.onboardingCompleted) {
            router.push("/dashboard");
          } else {
            setCheckingStatus(false);
          }
        })
        .catch(() => {
          setCheckingStatus(false);
        });
    }
  }, [status, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim() || null,
          smsAlertsEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: null,
          smsAlertsEnabled: false,
        }),
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setLoading(false);
    }
  }

  if (status === "loading" || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <Activity className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold">SiteDoc</span>
          </div>
          <h1 className="text-2xl font-bold">Welcome, {session.user.name}!</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Set up SMS alerts so we can notify you instantly when your site goes down.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Include your country code (e.g., +1 for US). We&apos;ll only text you when your site goes down or comes back up.
              </p>
            </div>

            {/* SMS toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">SMS Alerts</p>
                  <p className="text-xs text-muted-foreground">
                    Get text messages for outages & recovery
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={smsAlertsEnabled}
                onClick={() => setSmsAlertsEnabled(!smsAlertsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  smsAlertsEnabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    smsAlertsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Continue to Dashboard
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now — I&apos;ll set this up later
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
