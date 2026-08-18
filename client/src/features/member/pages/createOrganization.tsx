import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppStepper from "@/components/reusable ui/AppStepper";
import OptionCard from "@/components/reusable ui/OptionCard";
import {
  Building2,
  GraduationCap,
  Lock,
  Globe,
  ShieldQuestion,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useCreateOrganization, useGetModulesWithInternal } from "@/features/shared/hooks/useOrganizations";
import { checkSubdomainUnique } from "@/features/shared/api/organizations";
import type { MembershipModel, OrganizationPlan, OrganizationType } from "@/features/shared/api/organizations";

const STEP_LABELS = ["Type", "Details", "Branding", "Domain", "Admin", "Membership", "Plan & Modules", "Review"];

const ORG_TYPES: { value: OrganizationType; label: string; description: string; icon: any }[] = [
  { value: "society", label: "Residential Society", description: "Apartments, housing societies, gated communities", icon: Building2 },
  { value: "educational_institution", label: "Educational Institution", description: "Schools, colleges, coaching centers", icon: GraduationCap },
];

const MEMBERSHIP_OPTIONS: { value: MembershipModel; label: string; description: string; icon: any }[] = [
  { value: "open", label: "Open", description: "Anyone can join instantly, no approval needed", icon: Globe },
  { value: "approval_required", label: "Approval Required", description: "Admins review and approve each join request", icon: ShieldQuestion },
  { value: "invite_only", label: "Invite Only", description: "Members can only join via an invitation code", icon: Lock },
];

const PLAN_OPTIONS: { value: OrganizationPlan; label: string; description: string }[] = [
  { value: "free", label: "Free", description: "Core features for small communities" },
  { value: "community", label: "Community", description: "More modules and higher limits" },
  { value: "professional", label: "Professional", description: "Full feature set for growing organizations" },
  { value: "enterprise", label: "Enterprise", description: "Custom limits and dedicated support" },
];

type SubdomainStatus = "idle" | "checking" | "available" | "taken";

export default function CreateOrganization() {
  const navigate = useNavigate();
  const createOrganization = useCreateOrganization();
  const { data: modulesData, isLoading: modulesLoading } = useGetModulesWithInternal();
  const [step, setStep] = useState(1);

  const [organizationType, setOrganizationType] = useState<OrganizationType | null>(null);

  const [organizationName, setOrganizationName] = useState("");
  const [organizationLocation, setOrganizationLocation] = useState("");
  const [organizationTimezone, setOrganizationTimezone] = useState("Asia/Kolkata");
  const [organizationContactInfo, setOrganizationContactInfo] = useState("");

  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState("#7c3aed");
  const [organizationLogo, setOrganizationLogo] = useState("");

  const [subdomain, setSubdomain] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>("idle");

  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const [membershipModel, setMembershipModel] = useState<MembershipModel | null>(null);

  const [plan, setPlan] = useState<OrganizationPlan>("free");
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);

  const [launched, setLaunched] = useState(false);

  const selectableModules = (modulesData?.module_list ?? []).filter((m) => m.status && !m.is_internal);

  useEffect(() => {
    if (!subdomain.trim()) {
      setSubdomainStatus("idle");
      return;
    }
    setSubdomainStatus("checking");
    const handle = setTimeout(async () => {
      try {
        const result = await checkSubdomainUnique(subdomain.trim().toLowerCase());
        setSubdomainStatus(result.isUnique ? "available" : "taken");
      } catch {
        setSubdomainStatus("idle");
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [subdomain]);

  const toggleModule = (moduleId: number) => {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const canProceed = () => {
    if (step === 1) return !!organizationType;
    if (step === 2) return organizationName.trim().length > 0;
    if (step === 4) return subdomain.trim().length > 0 && subdomainStatus === "available";
    if (step === 5) return adminFirstName.trim().length > 0 && adminEmail.trim().length > 0;
    if (step === 6) return !!membershipModel;
    return true;
  };

  const handleLaunch = () => {
    if (!organizationType || !membershipModel) return;
    createOrganization.mutate(
      {
        organization_name: organizationName.trim(),
        organization_location: organizationLocation.trim() || undefined,
        organization_timezone: organizationTimezone || undefined,
        organization_contact_info: organizationContactInfo.trim() || undefined,
        organization_type: organizationType,
        subdomain: subdomain.trim().toLowerCase(),
        membership_model: membershipModel,
        plan,
        super_admin: {
          first_name: adminFirstName.trim(),
          last_name: adminLastName.trim() || undefined,
          email: adminEmail.trim(),
          phone: adminPhone.trim() || undefined,
        },
        module_ids: selectedModuleIds,
        themeConfig: { primary_color: primaryColor, secondary_color: secondaryColor },
        organization_logo: organizationLogo.trim() || undefined,
      },
      { onSuccess: () => setLaunched(true) }
    );
  };

  if (launched) {
    return (
      <Layout title="Create Organization" subtitle="Onboard a new community onto the platform">
        <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">{organizationName} is live!</h3>
          <p className="text-sm text-muted-foreground">
            An invite has been sent to {adminEmail} to activate the admin account.
          </p>
          <Button shape="pill" onClick={() => navigate("/platform-dashboard")}>
            Go to Platform Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Create Organization" subtitle="Onboard a new community onto the platform">
      <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
        <AppStepper stepData={STEP_LABELS} step={step} />

        <Card>
          <CardContent className="p-6 space-y-6">
            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">What kind of organization is this?</h3>
                <p className="text-sm text-muted-foreground mb-4">This determines the default setup for the community.</p>
                <div className="grid grid-cols-2 gap-3">
                  {ORG_TYPES.map((t) => (
                    <OptionCard
                      key={t.value}
                      icon={t.icon}
                      label={t.label}
                      description={t.description}
                      selected={organizationType === t.value}
                      onClick={() => setOrganizationType(t.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Organization Name</label>
                  <Input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="e.g. Green Valley Society" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Location</label>
                  <Input value={organizationLocation} onChange={(e) => setOrganizationLocation(e.target.value)} placeholder="e.g. Pune, India" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Timezone</label>
                  <Input value={organizationTimezone} onChange={(e) => setOrganizationTimezone(e.target.value)} placeholder="e.g. Asia/Kolkata" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Contact Info</label>
                  <Input value={organizationContactInfo} onChange={(e) => setOrganizationContactInfo(e.target.value)} placeholder="Phone or email for the organization" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-9 w-12 rounded border border-border cursor-pointer bg-transparent"
                      />
                      <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-9 w-12 rounded border border-border cursor-pointer bg-transparent"
                      />
                      <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Logo URL (optional)</label>
                  <Input value={organizationLogo} onChange={(e) => setOrganizationLogo(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground mb-1">Subdomain</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())}
                    placeholder="greenvalley"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">.platform.com</span>
                </div>
                {subdomainStatus === "checking" && <p className="text-xs text-muted-foreground">Checking availability…</p>}
                {subdomainStatus === "available" && <p className="text-xs text-emerald-600">Available</p>}
                {subdomainStatus === "taken" && <p className="text-xs text-destructive">Already taken, try another</p>}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This person will be invited as the organization's super admin and will complete account setup via email.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">First Name</label>
                    <Input value={adminFirstName} onChange={(e) => setAdminFirstName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Last Name</label>
                    <Input value={adminLastName} onChange={(e) => setAdminLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone (optional)</label>
                  <Input value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">How do members join?</h3>
                <p className="text-sm text-muted-foreground mb-4">You can change this later in organization settings.</p>
                <div className="grid grid-cols-1 gap-3">
                  {MEMBERSHIP_OPTIONS.map((m) => (
                    <OptionCard
                      key={m.value}
                      icon={m.icon}
                      label={m.label}
                      description={m.description}
                      selected={membershipModel === m.value}
                      onClick={() => setMembershipModel(m.value)}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Subscription Plan</label>
                  <Select value={plan} onValueChange={(v) => setPlan(v as OrganizationPlan)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label} — {p.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Modules</label>
                  {modulesLoading ? (
                    <p className="text-sm text-muted-foreground">Loading modules…</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectableModules.map((m) => (
                        <OptionCard
                          key={m.module_id}
                          label={m.name}
                          selected={selectedModuleIds.includes(m.module_id)}
                          onClick={() => toggleModule(m.module_id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Review</h3>
                <dl className="text-sm divide-y divide-border">
                  {[
                    ["Type", ORG_TYPES.find((t) => t.value === organizationType)?.label],
                    ["Name", organizationName],
                    ["Location", organizationLocation || "—"],
                    ["Subdomain", `${subdomain}.platform.com`],
                    ["Admin", `${adminFirstName} ${adminLastName} (${adminEmail})`],
                    ["Membership", MEMBERSHIP_OPTIONS.find((m) => m.value === membershipModel)?.label],
                    ["Plan", PLAN_OPTIONS.find((p) => p.value === plan)?.label],
                    ["Modules", `${selectedModuleIds.length} selected`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-2">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-foreground font-medium">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button shape="pill" variant="outline" disabled={step === 1} onClick={() => setStep((s) => s - 1)} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          {step < 8 ? (
            <Button shape="pill" disabled={!canProceed()} onClick={() => setStep((s) => s + 1)} className="gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button shape="pill" disabled={createOrganization.isPending} onClick={handleLaunch}>
              {createOrganization.isPending ? "Launching…" : "Launch Organization"}
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
