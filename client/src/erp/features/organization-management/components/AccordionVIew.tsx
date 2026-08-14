import React, { useEffect, useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Settings,
  GitBranch,
  Crown,
} from "lucide-react";
import { ThemeConfig } from "./OrganizationsSetupForm";
import { Button } from "@/components/ui/button";
import { WarnPopupModal } from "@/components/reusable ui/WarningDailogBox";
import { useDeleteOrganization } from "../hooks/deleteOrganization";
import { useLoading } from "@/utils/hooks/useLoading";
import { toast } from "@/hooks/use-toast";
import { capitalizeWords } from "@/utils/helper";
import { useRestoreOrganization } from "../hooks/restoreOrganization";
import { DynamicTabs } from "@/components/reusable ui/AppTabs";
import { Module, ModuleSubscription, OrganizationData, Pms } from "../utils/types";
import { TruncatedText } from "@/components/reusable ui/TruncateAndTooltip";
import { getDownloadUrl } from "@/lib/firebase-upload";

/** Resolves a Firebase storage path or legacy base64/URL to a displayable src */
const OrgLogo: React.FC<{ logo: string; className?: string }> = ({ logo, className }) => {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (!logo) return;
    // base64 data URLs or full http(s) URLs can be used directly
    if (logo.startsWith("data:") || logo.startsWith("http")) {
      setSrc(logo);
      return;
    }
    // Firebase storage path — resolve to signed URL
    getDownloadUrl(logo).then(setSrc).catch(() => setSrc(""));
  }, [logo]);

  if (!src) return null;
  return <img src={src} alt="Organization Logo" className={className} />;
};

/** Gets first two initials from an organization name */
const getOrgInitials = (name: string): string => {
  if (!name) return '??';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/** Generates a consistent color from a string */
const getInitialsBg = (name: string): string => {
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

/** Inline org avatar: logo if available, initials fallback */
const OrgAvatar: React.FC<{ logo?: string; name: string; className?: string }> = ({ logo, name, className = 'w-9 h-9' }) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    if (!logo) return;
    if (logo.startsWith('data:') || logo.startsWith('http')) {
      setSrc(logo);
      return;
    }
    getDownloadUrl(logo).then(setSrc).catch(() => setSrc(''));
  }, [logo]);

  if (src) {
    return <img src={src} alt={name} className={`${className} rounded-full object-cover border border-slate-200 dark:border-slate-700`} />;
  }

  return (
    <div className={`${className} rounded-full flex items-center justify-center text-xs font-semibold ${getInitialsBg(name)}`}>
      {getOrgInitials(name)}
    </div>
  );
};

interface BrandingConfig {
  logoUrl?: string;
  themeType: "default" | "manual";
  themeConfig: ThemeConfig;
}




interface Props {
  data: OrganizationData[];
  setEditOrganization: React.Dispatch<React.SetStateAction<OrganizationData | null>>
  setIsEdit?: React.Dispatch<React.SetStateAction<boolean>>
  refetchOrganizations?: () => void
}

const AccordionView: React.FC<Props> = ({ data, setEditOrganization, setIsEdit, refetchOrganizations }) => {
  const [organizationsData, setOrganizationsData] = useState<OrganizationData[]>(data);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openRestoreModal, setOpenRestoreModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  const { showLoader, hideLoader } = useLoading();

  const mutation = useDeleteOrganization();
  const mutationRestore = useRestoreOrganization();

  useEffect(() => {
    setOrganizationsData(data);
  }, [data])

  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const toggleOrg = (orgName: string) => {
    setExpandedOrgs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orgName)) {
        newSet.delete(orgName); // Collapse
      } else {
        newSet.add(orgName); // Expand
      }
      return newSet;
    });
  };
  const handleEditOrganization = (orgData: any) => {
    if (setIsEdit) {
      setEditOrganization(orgData);
      setIsEdit(true);
    }
  }

  const handleDeleteOrganization = (orgData: any) => {
    setOpenDeleteModal(true);
    setSelectedOrg(orgData);
  }
  const handleConfirmDelete = async () => {
    if (!selectedOrg) return;

    try {
      showLoader();
      await mutation.mutateAsync(selectedOrg.organization_id);
      refetchOrganizations && await refetchOrganizations();
      toast({
        title: "Success",
        description: "Organization deleted successfully",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    } finally {
      hideLoader();
      setOpenDeleteModal(false);
      setSelectedOrg(null);
    }
  };
  const handleRestoreOrganization = (orgData: any) => {
    setOpenRestoreModal(true);
    setSelectedOrg(orgData);
  }
  const handleConfirmRestore = async () => {
    if (!selectedOrg) return;
    try {
      showLoader();
      await mutationRestore.mutateAsync(selectedOrg.organization_id);
      refetchOrganizations && await refetchOrganizations();
      toast({
        title: "Success",
        description: "Organization restored successfully",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore organization",
        variant: "destructive",
      });
    } finally {
      hideLoader();
      setOpenRestoreModal(false);
      setSelectedOrg(null);
    }
  }
  const PmsTable = ({ pmsList }: { pmsList: Pms[] }) => {
    return (
      <div className="w-full max-h-[400px] overflow-x-auto overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-border text-left">
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">PMS Name</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">Client ID</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">Secret ID</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">Client Name</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">Account</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">Location</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">URL</th>
            </tr>
          </thead>
          <tbody>
            {pmsList?.map((pms, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                <td className="p-3 text-gray-900 dark:text-gray-200">{capitalizeWords(pms.pms_name)}</td>
                <td className="p-3 text-gray-900 dark:text-gray-200">{pms.client_id}</td>
                <td className="p-3 text-gray-900 dark:text-gray-200">{pms.pms_client_secret}</td>
                <td className="p-3 text-gray-900 dark:text-gray-200">{pms.pms_client_name}</td>
                <td className="p-3 text-gray-900 dark:text-gray-200">{pms.pms_account}</td>
                <td className="p-3 text-gray-900 dark:text-gray-200">{pms.pms_location}</td>
                <td className="p-3 text-gray-900 dark:text-gray-200">
                  <TruncatedText text={pms.pms_url || ""} maxWidth="max-w-[200px]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  const ModuleSubscriptionTable = ({ moduleSubscriptions, modules }: { moduleSubscriptions: ModuleSubscription[], modules: Module[] }) => {
    return (
      <div className="w-full max-h-[400px] overflow-x-auto overflow-y-auto border border-gray-200 dark:border-gray-700 rounded">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-border text-left">
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">Module</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">Term</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">Price</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">Start Date</th>
              <th className="p-3 text-gray-800 dark:text-gray-100 font-semibold text-sm">End Date</th>
            </tr>
          </thead>
          <tbody>
            {moduleSubscriptions?.map((sub, idx) => {
              const moduleName =
                modules.find((m) => m.id === sub.module_id)?.name || "";
              return (
                <tr
                  key={sub.module_id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  <td className="p-3 text-gray-900 dark:text-gray-200">{capitalizeWords(moduleName)}</td>
                  <td className="p-3 text-gray-900 dark:text-gray-200">{sub.term === "short" ? "Short-Term Contract" : "Long-Term Contract"}</td>
                  <td className="p-3 text-gray-900 dark:text-gray-200">{sub.price ? `${sub.price} $/${sub.term === "short" ? "Month" : "Year"}` : "—"}</td>
                  <td className="p-3 text-gray-900 dark:text-gray-200">{sub.startDate || "—"}</td>
                  <td className="p-3 text-gray-900 dark:text-gray-200">{sub.endDate || "—"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {organizationsData?.map((org, index) => {
        const isExpanded = expandedOrgs.has(org?.organization_name);
        return (
          <div
            key={index}
            className={`rounded-lg border transition-all duration-200 ${
              isExpanded
                ? 'border-primary/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            {/* Org Header */}
            <div
              className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                isExpanded
                  ? 'bg-primary/5 rounded-t-lg'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg'
              }`}
              onClick={() => toggleOrg(org?.organization_name)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <OrgAvatar logo={org?.organization_logo} name={org?.organization_name || ''} className="flex-shrink-0 w-9 h-9" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate">
                      {org?.organization_name}
                    </span>
                    {org?.is_franchisor && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Crown className="w-2.5 h-2.5" />
                        Franchisor
                      </span>
                    )}
                    {org?.parent_org_id && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700">
                        <GitBranch className="w-2.5 h-2.5" />
                        Franchisee
                      </span>
                    )}
                    {org?.is_archived && (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-700">
                        Archived
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    {org?.organization_email && <span>{org.organization_email}</span>}
                    {org?.organization_email && org?.pms_list?.length > 0 && <span>·</span>}
                    {org?.pms_list?.length > 0 && <span>{org.pms_list.length} PMS</span>}
                    {org?.modules?.length > 0 && <><span>·</span><span>{org.modules.length} Modules</span></>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!isExpanded && !org?.is_archived && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleEditOrganization(org); }}>
                    Edit
                  </Button>
                )}
                <button className="p-1 hover:bg-accent rounded transition-colors">
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                {/* Organization Details */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Organization Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">
                    <div><span className="text-muted-foreground text-xs">Name</span><p className="font-medium text-foreground mt-0.5">{org?.organization_name || "N/A"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium text-foreground mt-0.5">{org?.organization_email || "N/A"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Address</span><p className="font-medium text-foreground mt-0.5">{org?.organization_location || "N/A"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Timezone</span><p className="font-medium text-foreground mt-0.5">{org?.organization_timezone || "N/A"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Contact</span><p className="font-medium text-foreground mt-0.5">{org?.organization_contact_info || "N/A"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Parent Org ID</span><p className="font-medium text-foreground mt-0.5">{org?.parent_org_id ?? "N/A"}</p></div>
                  </div>
                </div>

                {/* Super Admin */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Super Admin</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
                    <div><span className="text-muted-foreground text-xs">Name</span><p className="font-medium text-foreground mt-0.5">{org?.super_admin_name || "N/A"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Email</span><p className="font-medium text-foreground mt-0.5">{org?.super_admin_email || "N/A"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Phone</span><p className="font-medium text-foreground mt-0.5">{org?.super_admin_phone || "N/A"}</p></div>
                    <div><span className="text-muted-foreground text-xs">Role</span><p className="font-medium text-foreground mt-0.5">{org?.super_admin_role === 'super_admin' ? "Super Admin" : "N/A"}</p></div>
                  </div>
                </div>

                {/* Modules */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Modules</h4>
                  {org?.modules?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {org.modules.map((module: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-primary/5 text-primary border border-primary/10">
                          {module.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No modules selected</p>
                  )}
                </div>

                {/* PMS */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">PMS Integrations</h4>
                  <DynamicTabs tabs={[{
                    label: `Active (${org?.pms_list?.filter((pms: any) => !pms.is_archived)?.length || 0})`,
                    value: "all",
                    content: org?.pms_list?.filter((pms: any) => !pms.is_archived)?.length > 0 ? <PmsTable pmsList={org?.pms_list?.filter((pms: any) => !pms.is_archived) || []} /> : <p className="py-3 text-xs text-muted-foreground">No active PMS records</p>
                  }, {
                    label: `Archived (${org?.pms_list?.filter((pms: any) => pms.is_archived)?.length || 0})`,
                    value: "archived",
                    content: org?.pms_list?.filter((pms: any) => pms.is_archived)?.length > 0 ? <PmsTable pmsList={org?.pms_list?.filter((pms: any) => pms.is_archived) || []} /> : <p className="py-3 text-xs text-muted-foreground">No archived PMS records</p>
                  }]} defaultValue="all" />
                </div>

                {/* Module Subscriptions */}
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Module Subscriptions</h4>
                  {org?.moduleSubscriptions?.length > 0 ? <ModuleSubscriptionTable moduleSubscriptions={org?.moduleSubscriptions || []} modules={org?.modules || []} /> : <p className="text-xs text-muted-foreground">No module subscriptions</p>}
                </div>

                {/* Branding + Actions */}
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Branding</h4>
                      <div className="flex items-center gap-6">
                        {org?.organization_logo && (
                          <OrgLogo logo={org.organization_logo} className="h-12 w-auto border border-slate-200 dark:border-slate-700 rounded object-contain" />
                        )}
                        {org?.themeConfig !== null ? (
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Primary</span>
                              <span className="w-5 h-5 rounded border border-slate-200 dark:border-slate-700" style={{ backgroundColor: org.themeConfig?.primary_color }} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Secondary</span>
                              <span className="w-5 h-5 rounded border border-slate-200 dark:border-slate-700" style={{ backgroundColor: org.themeConfig?.secondary_color }} />
                            </div>
                            {org.themeConfig?.font_family && (
                              <span className="text-xs text-muted-foreground">Font: <span className="text-foreground font-medium">{org.themeConfig.font_family}</span></span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Default theme</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {org?.is_archived ? (
                        <Button size="sm" className="h-8 text-xs" onClick={() => handleRestoreOrganization(org)}>Restore</Button>
                      ) : (
                        <>
                          <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={() => handleDeleteOrganization(org)}>Archive</Button>
                          <Button size="sm" className="h-8 text-xs px-5" onClick={() => handleEditOrganization(org)}>Edit</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <WarnPopupModal
        open={openRestoreModal}
        onOpenChange={(open) => setOpenRestoreModal(open)}
        message={`Are you sure you want to restore this ${selectedOrg?.organization_name} organization?`}
        onConfirm={handleConfirmRestore}
        actionType="default"
      />
      <WarnPopupModal
        open={openDeleteModal}
        onOpenChange={(open) => setOpenDeleteModal(open)}
        message={`Are you sure you want to archive this ${selectedOrg?.organization_name} organization?`}
        onConfirm={handleConfirmDelete}
        actionType="archive"
      />
    </div>
  );
};

export default AccordionView;
