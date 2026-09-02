import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, CreditCard } from "lucide-react";
import type { OrganizationPlan } from "@/features/shared/api/organizations";

const PLANS: Array<{
  value: OrganizationPlan;
  label: string;
  description: string;
  features: string[];
}> = [
  {
    value: "free",
    label: "Free",
    description: "A lightweight starting point for smaller communities.",
    features: ["Core organization setup", "Member directory", "Basic events and announcements"],
  },
  {
    value: "community",
    label: "Community",
    description: "More capability for active resident communities.",
    features: ["Everything in Free", "Expanded community modules", "Donations and sponsorship workflows"],
  },
  {
    value: "professional",
    label: "Professional",
    description: "A broader operational feature set for growing organizations.",
    features: ["Everything in Community", "Advanced operational modules", "Broader reporting and administration"],
  },
  {
    value: "enterprise",
    label: "Enterprise",
    description: "Designed for organizations that need tailored governance and support.",
    features: ["Everything in Professional", "Enterprise-level configuration", "Dedicated commercial support"],
  },
];

export default function SubscriptionPlans() {
  return (
    <Layout title="Subscription Plans" subtitle="Compare the plans available to organizations" icon={<CreditCard className="w-5 h-5" />}>
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
        <Link to="/platform-dashboard">
          <Button variant="ghost" shape="pill" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Platform Dashboard
          </Button>
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <Card key={plan.value} className="h-full">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{plan.label}</CardTitle>
                  <Badge variant={plan.value === "professional" ? "default" : "outline"}>
                    {plan.value}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Plan names mirror the backend OrganizationPlan enum. Feature descriptions above are product copy and should be
          aligned with the final commercial policy before publication; the backend currently defines the plan values, not
          pricing or per-plan limits.
        </p>
      </div>
    </Layout>
  );
}
