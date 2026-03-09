"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Activity,
  Bell,
  CheckCircle,
  Globe,
  MessageSquare,
  Shield,
  Zap,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PLANS, type PlanId } from "@/lib/plans";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SiteDoc</span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-8">
            <Zap className="h-3.5 w-3.5 text-primary" />
            Real-time website monitoring
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Know when your site
            <br />
            <span className="text-primary">goes down.</span> Instantly.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            SiteDoc monitors your websites 24/7 and sends you an SMS alert the
            moment something breaks — with a diagnosis and suggested fix.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto text-base px-8">
                Start Monitoring Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base px-8"
              >
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Alert preview */}
      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/50 border-border/50 p-0 overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              SMS Alert Preview
            </div>
            <div className="p-5 font-mono text-sm leading-relaxed text-muted-foreground">
              <p className="text-foreground font-medium">
                SiteDoc Alert: mystore.com is DOWN.
              </p>
              <p className="mt-2">Issue: Timeout</p>
              <p>Diagnosis: Server is not responding in time.</p>
              <p>
                Suggested fix: Check server load, hosting status, or firewall
                rules.
              </p>
              <p className="mt-2 text-xs text-muted-foreground/60">
                Mar 8, 2026 2:34 PM
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Everything you need to stay online
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Simple, powerful monitoring that tells you what went wrong and how
              to fix it.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: "Monitor Multiple Sites",
                desc: "Add all your websites and track their uptime from a single dashboard.",
              },
              {
                icon: Bell,
                title: "Instant SMS Alerts",
                desc: "Get a text message the moment your site goes down — no email delays.",
              },
              {
                icon: Shield,
                title: "Outage Diagnosis",
                desc: "Automatically identify DNS errors, SSL issues, timeouts, and server failures.",
              },
              {
                icon: Zap,
                title: "Suggested Fixes",
                desc: "Every alert includes a recommended action so you can resolve issues fast.",
              },
              {
                icon: CheckCircle,
                title: "Recovery Alerts",
                desc: "Know when your site is back online with automatic recovery notifications.",
              },
              {
                icon: Activity,
                title: "Incident History",
                desc: "Track all past incidents with timestamps, types, and resolution details.",
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="bg-card/50 hover:bg-card/80 transition-colors"
              >
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-base mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              Start free. Upgrade as you grow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {(Object.entries(PLANS) as [PlanId, (typeof PLANS)[PlanId]][]).map(
              ([id, plan]) => (
                <Card
                  key={id}
                  className={`relative ${
                    id === "starter"
                      ? "border-primary/50 bg-card shadow-lg shadow-primary/5"
                      : "bg-card/50"
                  }`}
                >
                  {id === "starter" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground text-sm">
                          /{plan.interval}
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button
                      variant={id === "starter" ? "primary" : "outline"}
                      className="w-full"
                    >
                      Get Started
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </Card>
              )
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "How does SiteDoc monitor my sites?",
                a: "We send HTTP requests to your URLs at regular intervals (1\u20135 minutes depending on your plan). If a request fails or times out, we immediately alert you via SMS.",
              },
              {
                q: "What types of issues can SiteDoc detect?",
                a: "We detect timeouts, DNS failures, SSL certificate issues, 4xx/5xx errors, and connection refused errors. Each alert includes a diagnosis and suggested fix.",
              },
              {
                q: "Will I get spammed with alerts?",
                a: "No. We only send alerts on state changes \u2014 when a site transitions from online to down, and again when it recovers. You won\u2019t get repeated alerts for the same ongoing issue.",
              },
              {
                q: "Can I use my own phone number for alerts?",
                a: "Yes. Add your phone number in your account settings, and all SMS alerts will be sent to that number.",
              },
              {
                q: "Is there a free plan?",
                a: "Yes. The free plan lets you monitor 1 website with full SMS alerting and diagnosis features.",
              },
            ].map((faq) => (
              <Card key={faq.q} className="bg-card/50">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start monitoring in under a minute
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Sign up free, add your URL, and we&apos;ll watch it for you.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-base px-10">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span>SiteDoc</span>
          </div>
          <p>&copy; 2026 SiteDoc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
