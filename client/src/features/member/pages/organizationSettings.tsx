import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import OptionCard from "@/components/reusable ui/OptionCard";
import { 
  Building2, 
  Palette, 
  ShieldQuestion, 
  Boxes, 
  Globe, 
  Lock, 
  ArrowLeft, 
  Save 
} from "lucide-react";

import { useGetModulesWithInternal } from "@/features/shared/hooks/useOrganizations";
import { 
  getOrganizationById, 
  updateOrganization 
} from "@/features/shared/api/organizations";
import type { MembershipModel, OrganizationPlan } from "@/features/shared/api/organizations";

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

export default function OrganizationSettings() {
  const { id } = useParams<{ id: string }>();
  const orgId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: orgData, isLoading: isOrgLoading } = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganizationById(orgId),
    enabled: !!orgId,
  });

  const { data: modulesData, isLoading: isModulesLoading } = useGetModulesWithInternal();

  // Form State
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [contactInfo, setContactInfo] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [secondaryColor, setSecondaryColor] = useState("#7c3aed");
  const [logo, setLogo] = useState("");
  const [membershipModel, setMembershipModel] = useState<MembershipModel>("open");
  const [plan, setPlan] = useState<OrganizationPlan>("free");
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);

  // Prefill form when organization data is loaded
  useEffect(() => {
    if (orgData) {
      setName(orgData.organization_name || "");
      setLocation(orgData.organization_location || "");
      setTimezone(orgData.organization_timezone || "Asia/Kolkata");
      setContactInfo(orgData.organization_contact_info || "");
      setPrimaryColor(orgData.theme_config?.primary_color || "#2563eb");
      setSecondaryColor(orgData.theme_config?.secondary_color || "#7c3aed");
      setLogo(orgData.organization_logo || "");
      setMembershipModel(orgData.membership_model || "open");
      setPlan(orgData.plan || "free");
      setSelectedModuleIds(orgData.module_ids || []);
    }
  }, [orgData]);

  const updateMut = useMutation({
    mutationFn: (data: any) => updateOrganization(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      navigate("/platform-dashboard");
    },
  });

  const toggleModule = (moduleId: number) => {
    setSelectedModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((i) => i !== moduleId) : [...prev, moduleId]
    );
  };

  const handleSave = () => {
    updateMut.mutate({
      organization_name: name,
      organization_location: location,
      organization_timezone: timezone,
      organization_contact_info: contactInfo,
      membership_model: membershipModel,
      plan,
      module_ids: selectedModuleIds,
      themeConfig: { primary_color: primaryColor, secondary_color: secondaryColor },
      organization_logo: logo,
    });
  };

  const selectableModules = (modulesData?.module_list ?? []).filter((m) => m.status && !m.is_internal);

  if (isOrgLoading) {
    return (
      <Layout title="Organization Settings" subtitle="Loading organization details...">
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Organization Settings" subtitle={`Manage ${name || "Organization"}`} icon={<Building2 className="w-5 h-5" />}>
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" shape="pill" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button shape="pill" onClick={handleSave} disabled={updateMut.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {updateMut.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Tabbed Settings View */}
        <Tabs defaultValue="general" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="gap-2">
              <Building2 className="w-4 h-4" /> General
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="w-4 h-4" /> Branding
            </TabsTrigger>
            <TabsTrigger value="membership" className="gap-2">
              <ShieldQuestion className="w-4 h-4" /> Membership
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-2">
              <Boxes className="w-4 h-4" /> Plan & Modules
            </TabsTrigger>
          </TabsList>

          {/* 1. General Info */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">General Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Information</Label>
                  <Input id="contact" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Theme & Branding */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Theme & Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
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
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
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
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input id="logo" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Membership Access Model */}
          <TabsContent value="membership">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Membership Model</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Plan & Modules */}
          <TabsContent value="plan">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Subscription & Feature Modules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Subscription Plan</Label>
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

                <div className="space-y-3">
                  <Label>Enabled Feature Modules</Label>
                  {isModulesLoading ? (
                    <Skeleton className="h-20 w-full" />
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}