export const PLANS = {
  free: {
    name: "Free",
    maxSites: 1,
    price: 0,
    interval: "forever",
    features: [
      "1 monitored site",
      "5-minute check interval",
      "SMS alerts",
      "Basic diagnosis",
    ],
  },
  starter: {
    name: "Starter",
    maxSites: 5,
    price: 9,
    interval: "month",
    features: [
      "5 monitored sites",
      "2-minute check interval",
      "SMS alerts",
      "Detailed diagnosis",
      "Incident history",
    ],
  },
  pro: {
    name: "Pro",
    maxSites: 20,
    price: 29,
    interval: "month",
    features: [
      "20 monitored sites",
      "1-minute check interval",
      "SMS + Email alerts",
      "Advanced diagnosis",
      "Full incident history",
      "Priority support",
    ],
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanLimits(plan: string) {
  return PLANS[plan as PlanId] || PLANS.free;
}
