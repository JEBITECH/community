import React, { useEffect, useState } from 'react';
import {
  Settings,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Shield,
  Users,
  Key,
  Plus,
  UserCheck,
  Save
} from 'lucide-react';
import { useGetModulesWithInternal } from "../../organization-management/hooks/getAllModulesWithInternal";
import { useOrganizations } from "../../organization-management/hooks/getOrganizations";
import { useOrganizationContext } from '@/contexts/OrganizationContext';
import { capitalizeWords } from '@/utils/helper';
import { useAddOrganiztionRole } from '../hooks/addOrgnizationRole';
import { useGetRolesByOrganization } from '../hooks/getRolesByOrganization';
import { useAddRoleModuleAccess } from '../hooks/addRoleModuleAccess';
import { useGetRoleModuleAccessByOrganization } from '../hooks/getRoleModuleAccess';
import { useLoading } from "@/utils/hooks/useLoading";
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { addRoleModuleAccess } from '../api';
import { ReloadIcon } from "@radix-ui/react-icons";
import { useAuth } from '@/hooks/useAuth'; // Import useAuth hook
import {
  CompanyNotificationChannels,
  getNotificationPreferences,
  saveCompanyNotificationPreference,
} from "../../notification/api";
import masterRoles from '../data/masterRoles.json';
import {
  AssignedModuleSettingPanel,
  OrgSettingBadge,
  SettingToggle,
} from './assigned-module/AssignedModuleSettingPanel';

interface ModuleAction {
  id: string;
  action: string;
  subaction: string;
  permissions: string[];
  isEnabled: boolean;
  isVisible: boolean;
}

interface Module {
  id: string;
  name: string;
  actions: ModuleAction[];
  isExpanded: boolean;
  is_internal?: boolean;
}

interface RolePermissions {
  [roleName: string]: {
    [actionId: string]: string[];
  };
}

interface SelectedSubActions {
  [roleId: string]: {
    [actionId: string]: number[];
  }
}

const companyChannelDefaults: CompanyNotificationChannels = {
  allowEmail: true,
  allowSms: true,
  allowPush: true,
  allowWhatsapp: true,
  allowInApp: true,
};

const COMPANY_CHANNEL_LABELS: Record<keyof CompanyNotificationChannels, string> = {
  allowEmail: "Email",
  allowSms: "SMS",
  allowPush: "Push",
  allowWhatsapp: "WhatsApp",
  allowInApp: "In-App",
};

const RoleAccessRights: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('assigned-rights');
  const [roles, setRoles] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const { selectedOrganizationId } = useOrganizationContext();
  const selectedOrganization = selectedOrganizationId;
  const [selectedSubActions, setSelectedSubActions] = useState<SelectedSubActions>({});
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({});
  const [companyChannels, setCompanyChannels] = useState<CompanyNotificationChannels>(companyChannelDefaults);
  const [companySettings, setCompanySettings] = useState<{
    notifyManagerForUpcomingTask?: boolean;
    intervals?: number[];
  }>({
    notifyManagerForUpcomingTask: false,
    intervals: [1440, 60, 15],
  });
  const [isCompanySaving, setIsCompanySaving] = useState(false);
  const [isCompanyExpanded, setIsCompanyExpanded] = useState(false);

  const { user } = useAuth();
  const { data: organizationsList, isLoading: isLoadingOrganizations } = useOrganizations();
  const { data: getAllModules, isLoading: isLoadingModules } = useGetModulesWithInternal();
  const { data: rolesList, isLoading: isLoadingRoles, refetch: refetchRoles } = useGetRolesByOrganization(selectedOrganization);
  //@ts-ignore
  const { data: roleModuleAccess, isLoading: isLoadingRoleModuleAccess, refetch: refetchRoleModuleAccess } = useGetRoleModuleAccessByOrganization(selectedOrganization, selectedRole, { enabled: !!selectedRole });

  const mutation = useAddOrganiztionRole();
  const { showLoader, hideLoader } = useLoading();

  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [isLoading, setIsLoading] = useState(false);
  const organizationId = selectedOrganization ? Number(selectedOrganization) : undefined;

  // Check if current user is super admin
  const isSuperAdmin = (user as any)?.role === "super_admin";
  const isMasterAdmin = (user as any)?.role === "platformOwner";

  useEffect(() => {
    if (isLoadingOrganizations || isLoadingModules) {
      showLoader();
    } else {
      hideLoader();
    }
  }, [isLoadingOrganizations, isLoadingModules]);

  useEffect(() => {
    if (rolesList) {
      setRoles(rolesList?.role_list || []);
    }
  }, [rolesList]);

  useEffect(() => {
    if (organizationsList) {
      const orgList = organizationsList?.organization_list || [];
      setOrganizations(orgList);
    }
  }, [organizationsList, isSuperAdmin, user]);

  useEffect(() => {
    if (getAllModules) {
      setModulesList(getAllModules?.module_list || []);
    }
  }, [getAllModules]);

  useEffect(() => {
    if (!organizationId || Number.isNaN(organizationId)) {
      setCompanyChannels(companyChannelDefaults);
      setCompanySettings({
        notifyManagerForUpcomingTask: false,
        intervals: [1440, 60, 15],
      });
      return;
    }

    const loadCompanyPreferences = async () => {
      const data = (await getNotificationPreferences({ organizationId })) as {
        company?: {
          channels?: CompanyNotificationChannels;
          settings?: {
            notifyManagerForUpcomingTask?: boolean;
            intervals?: number[];
          };
        };
      };
      setCompanyChannels({ ...companyChannelDefaults, ...(data.company?.channels || {}) });
      setCompanySettings({
        notifyManagerForUpcomingTask: data.company?.settings?.notifyManagerForUpcomingTask ?? false,
        intervals: data.company?.settings?.intervals || [1440, 60, 15],
      });
    };

    loadCompanyPreferences().catch(() => {
      toast({
        title: "Warning",
        description: "Unable to load company notification settings.",
      });
    });
  }, [organizationId]);

  useEffect(() => {
    if (selectedOrganization && organizations.length && modulesList.length) {
      const organization = organizations.find(
        (org: any) => org.organization_id === +selectedOrganization
      );

      const organizationModuleIds =
        organization?.modules?.map((module: any) => module.id) || [];

      // Include org-assigned modules AND all internal modules
      const filteredModules = modulesList.filter((module: any) =>
        organizationModuleIds.includes(module.module_id) || module.is_internal === true
      );

      // Transform API data to UI-friendly structure
      const mappedModules = filteredModules.map((module: any) => ({
        id: module.module_id,
        name: module.name || "Unnamed Module",
        isExpanded: false,
        is_internal: module.is_internal ?? false,
        actions:
          module.action_list?.map((action: any) => ({
            id: action.action_id,
            action: action.name || "Unnamed Action",
            subaction: action.sub_action_list?.filter((sub: any) => sub.sub_Action_id !== null).map((sub: any) => ({ name: sub.name || "", id: sub.sub_Action_id })) || [],
            isEnabled: action.status ?? false,
            permissions: action.permission_list || [],
            isVisible: true,
          })) || [],
      }));
      setModules(mappedModules);
    }
  }, [selectedOrganization, organizations, modulesList]);

  useEffect(() => {
    // Always run when role or access data changes so state is fully reset
    // (even when module_list is empty — e.g. after revoking the last module)
    if (!selectedRole) return;

    const initialSelectedSubActions: SelectedSubActions = {};
    const initialSelectedModules: Record<string, boolean> = {};

    roleModuleAccess?.module_list?.forEach((module: any) => {
      // Only non-internal modules with no actions get a module-level checkbox.
      // Internal modules (Org Mgmt, ACL Mgmt…) are always available via
      // buildInternalModulesDtos and must NOT be treated as user-granted.
      if (!module.is_internal && (!module.action_list || module.action_list.length === 0)) {
        initialSelectedModules[module.module_id] = true;
      }

      module.action_list?.forEach((action: any) => {
        if (!initialSelectedSubActions[selectedRole]) {
          initialSelectedSubActions[selectedRole] = {};
        }

        if (action.sub_action_list?.length > 0) {
          const specificSubs = action.sub_action_list.filter(
            (sub: any) => sub.sub_Action_id !== null && sub.status
          );
          const hasNullOnly = specificSubs.length === 0 &&
            action.sub_action_list.some((sub: any) => sub.sub_Action_id === null);

          if (specificSubs.length > 0) {
            // Prefer specific sub-action IDs — null entries are stale or action-level rows
            initialSelectedSubActions[selectedRole][action.action_id] = specificSubs.map(
              (sub: any) => sub.sub_Action_id
            );
          } else if (hasNullOnly) {
            // Genuinely action-level grant with no sub-action specificity → Full Access
            initialSelectedSubActions[selectedRole][action.action_id] = [-1];
          }
        }
      });
    });

    setSelectedSubActions(initialSelectedSubActions);
    setSelectedModules(initialSelectedModules);
  }, [roleModuleAccess, selectedRole]);
  const toggleModuleExpansion = (moduleId: string) => {
    setModules(prev =>
      prev.map(module =>
        module.id === moduleId ? { ...module, isExpanded: !module.isExpanded } : module
      )
    );
  };

  const toggleActionEnabled = (moduleId: string, actionId: string) => {
    setModules(prev =>
      prev.map(module =>
        module.id === moduleId
          ? {
            ...module,
            actions: module.actions.map(action =>
              action.id === actionId ? { ...action, isEnabled: !action.isEnabled } : action
            )
          }
          : module
      )
    );
  };

  const toggleActionVisible = (moduleId: string, actionId: string) => {
    setModules(prev =>
      prev.map(module =>
        module.id === moduleId
          ? {
            ...module,
            actions: module.actions.map(action =>
              action.id === actionId ? { ...action, isVisible: !action.isVisible } : action
            )
          }
          : module
      )
    );
  };

  // Filter modules based on search
  const filteredModules = modules.map(module => ({
    ...module,
    actions: module?.actions?.filter(action =>
      action.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.subaction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.permissions.some(perm => perm.toLowerCase().includes(searchTerm.toLowerCase())) || ''
    )
  })).filter(module =>
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.actions.length > 0
  );

  const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; className?: string }> =
    ({ onClick, icon, className = "" }) => (
      <button
        onClick={onClick}
        className={`p-1 rounded hover:bg-accent hover:text-accent-foreground transition-colors ${className}`}
      >
        {icon}
      </button>
    );
  const handleAddRole = async (name: string) => {
    try {
      showLoader();
      const payload = {
        name,
        status: true,
        organization_id: Number(selectedOrganization)
      }
      await mutation.mutateAsync(payload);
      await refetchRoles();
      toast({
        title: "Success",
        description: "Role added successfully",
        variant: "success",
      })
      setIsModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add role",
      })
    } finally {
      hideLoader();
      setNewRoleName('');
    }
  }

  const handleSaveRoleModuleAccess = async () => {
    if (!selectedRole || !selectedOrganization) {
      toast({
        title: "Error",
        description: "Please select a role and organization before saving.",
      });
      return;
    }

    // ── Modules with no actions: always include so the backend can add or remove access ──
    const noActionModulePayloads = modules
      .filter(module => module.actions.length === 0)
      .map(module => ({
        module_id: Number(module.id),
        // selected → grant access via null action sentinel
        // not selected → empty list so backend removes existing access
        action_list: selectedModules[module.id]
          ? [{ action_id: null, sub_action_list: [{ sub_action_id: null }] }]
          : []
      }));

    // ── Modules with actions: include only those where the user made at least one selection ──
    const actionModulePayloads = modules
      .filter(module => module.actions.length > 0)
      .map(module => {
        const action_list = module.actions
          .filter(action => (selectedSubActions[selectedRole]?.[action.id]?.length ?? 0) > 0)
          .map(action => {
            const selectedSubs = selectedSubActions[selectedRole][action.id];
            const sub_action_list = selectedSubs.includes(-1)
              ? [{ sub_action_id: null }]
              : selectedSubs.map(sub_action_id => ({ sub_action_id }));
            return { action_id: Number(action.id), sub_action_list };
          });
        return { module_id: Number(module.id), action_list };
      })
      .filter(module => module.action_list.length > 0);

    const assign_modules = [...noActionModulePayloads, ...actionModulePayloads];

    const payload = {
      role_id: Number(selectedRole),
      organization_id: Number(selectedOrganization),
      assign_modules
    };

    try {
      showLoader();
      setIsLoading(true);
      const responseRoleModuleAccess = await addRoleModuleAccess(payload);
      if (responseRoleModuleAccess) {
        await refetchRoleModuleAccess();
        await refetchRoles();
      }
      toast({
        title: "Success",
        description: "Role module access saved successfully.",
        variant: "success",
      });

    } catch (error) {
      console.error("Error saving role module access:", error);
      toast({
        title: "Error",
        description: "Failed to save role module access.",
      });
    } finally {
      hideLoader();
      setIsLoading(false);
    }
  };

  const handleSaveCompanyPreferences = async () => {
    if (!organizationId || Number.isNaN(organizationId)) {
      toast({
        title: "Error",
        description: "Please select an organization before saving company settings.",
      });
      return;
    }

    try {
      setIsCompanySaving(true);
      await saveCompanyNotificationPreference({
        organizationId,
        channels: companyChannels,
        settings: companySettings,
      });
      const data = (await getNotificationPreferences({ organizationId })) as {
        company?: {
          channels?: CompanyNotificationChannels;
          settings?: {
            notifyManagerForUpcomingTask?: boolean;
            intervals?: number[];
          };
        };
      };
      setCompanyChannels({ ...companyChannelDefaults, ...(data.company?.channels || {}) });
      setCompanySettings({
        notifyManagerForUpcomingTask: data.company?.settings?.notifyManagerForUpcomingTask ?? false,
        intervals: data.company?.settings?.intervals || [1440, 60, 15],
      });
      toast({
        title: "Success",
        description: "Company notification settings saved successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save company notification settings.",
      });
    } finally {
      setIsCompanySaving(false);
    }
  };



  const getUserOrganizationName = () => {
    if (isSuperAdmin && (user as any)?.organization_id) {
      const userOrg = organizations.find(
        (org: any) => org.organization_id === (user as any)?.organization_id
      );
      return userOrg?.organization_name ;
    }
    return null;
  };

  const userOrgName = getUserOrganizationName();
  const selectedOrganizationDetails = organizations.find(
    (org: any) => org.organization_id === Number(selectedOrganization),
  );
  const selectedOrganizationName =
    selectedOrganizationDetails?.organization_name ?? userOrgName ?? undefined;

  return (
    <div className="space-y-6">
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Role-Based Access Control</h2>
              <div className="flex items-center gap-2">
                {selectedTab === 'role-access-rights' && (
                  <Button onClick={() => setIsModalOpen(true)} variant="default" size="sm" className="h-8 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Role
                  </Button>
                )}
                {selectedTab === 'assign-permissions' && (
                  <>
                    <Select value={selectedRole ?? ''} onValueChange={setSelectedRole}>
                      <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map((role: any, idx: number) => (
                          <SelectItem key={idx} value={role?.role_id}>
                            {masterRoles.find(r => r.value === role?.name)?.label ?? role?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleSaveRoleModuleAccess}
                      variant="default"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <ReloadIcon className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Permissions"
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <TabsList className="h-auto p-0 bg-transparent">
              <TabsTrigger
                value="assigned-rights"
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-primary/5 data-[state=active]:shadow-none"
              >
                <Settings className="w-4 h-4 mr-2" />
                Assigned Modules
              </TabsTrigger>
              <TabsTrigger
                value="role-access-rights"
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-primary/5 data-[state=active]:shadow-none"
              >
                <Users className="w-4 h-4 mr-2" />
                Role Management
              </TabsTrigger>
              <TabsTrigger
                value="assign-permissions"
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-primary/5 data-[state=active]:shadow-none"
              >
                <Key className="w-4 h-4 mr-2" />
                Assign Permissions
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="p-5">

        <TabsContent value="role-access-rights" className="mt-0">
              {roles?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {roles?.map((role: any) => (
                    <div key={role?.role_id} className="group flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-150">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground truncate">
                          {masterRoles.find(r => r.value === role?.name)?.label ?? role?.name}
                        </h3>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14">
                  <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2.5">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">No Roles Created</h3>
                  <p className="text-xs text-muted-foreground mb-3">Create your first role to start managing permissions.</p>
                  <Button onClick={() => setIsModalOpen(true)} variant="default" size="sm" className="h-8 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create First Role
                  </Button>
                </div>
              )}
        </TabsContent>

        <TabsContent value="assigned-rights" className="mt-0">
          <div className="space-y-2">
            {filteredModules.length > 0 ? (
              filteredModules.map((module) => {
                const isExpanded = module.isExpanded;
                const actionCount = module.actions?.length || 0;
                const enabledCount = module.actions?.filter((a: any) => a.isEnabled).length || 0;
                return (
                  <div key={module.id} className={`rounded-lg border transition-all duration-150 ${
                    isExpanded ? 'border-primary/30' : 'border-slate-200 dark:border-slate-700'
                  }`}>
                    <div
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                      onClick={() => toggleModuleExpansion(module.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isExpanded ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <Settings className="w-3.5 h-3.5" />
                        </div>
                        <span className={`text-sm font-medium ${isExpanded ? 'text-primary' : 'text-foreground'}`}>{module.name}</span>
                        <span className="text-xs text-muted-foreground">{actionCount} actions</span>
                        {enabledCount > 0 && <span className="text-xs text-emerald-600 dark:text-emerald-400">· {enabledCount} enabled</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {actionCount > 0 && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            isExpanded ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                          }`}>{actionCount}</span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-slate-700">
                        {module.actions?.length > 0 ? (
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                                <th className="px-4 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-10">{isMasterAdmin && <input type="checkbox" className="w-3.5 h-3.5 rounded" />}</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                                <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Subactions</th>
                                <th className="px-4 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-20">Visible</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                              {module.actions.map((action: any) => (
                                <tr key={action.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                  <td className="px-4 py-2"><input type="checkbox" checked={action.isEnabled} onChange={() => toggleActionEnabled(module.id, action.id)} className="w-3.5 h-3.5 rounded" disabled={!isMasterAdmin} /></td>
                                  <td className="px-3 py-2"><span className="font-medium text-foreground text-xs">{capitalizeWords(action.action)}</span></td>
                                  <td className="px-3 py-2">
                                    {Array.isArray(action.subaction) && action.subaction.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {action.subaction.map((s: any, i: number) => (
                                          <span key={i} className="inline-flex px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-700 text-muted-foreground">{capitalizeWords(s?.name)}</span>
                                        ))}
                                      </div>
                                    ) : <span className="text-xs text-muted-foreground/40">—</span>}
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <button onClick={() => toggleActionVisible(module.id, action.id)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors inline-flex">
                                      {action.isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="px-4 py-5 text-center text-xs text-muted-foreground">No actions available</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-14">
                <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2.5">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">No Assigned Modules</h3>
                <p className="text-xs text-muted-foreground">This organization doesn't have any modules assigned yet.</p>
              </div>
            )}

         
            <AssignedModuleSettingPanel
              title="Notification Settings"
              description="Manage org-wide notification channels from Access Modules."
              meta={`${Object.keys(companyChannels).length} channels`}
              badge={<OrgSettingBadge organizationId={organizationId} />}
              isExpanded={isCompanyExpanded}
              onToggle={() => setIsCompanyExpanded(!isCompanyExpanded)}
            >
              <div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(Object.entries(companyChannels) as Array<[keyof CompanyNotificationChannels, boolean]>).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <span className="text-sm font-medium text-foreground">{COMPANY_CHANNEL_LABELS[key]}</span>
                      <SettingToggle
                        checked={Boolean(value)}
                        disabled={!organizationId || isCompanySaving}
                        onChange={() =>
                          setCompanyChannels((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-4 bg-slate-50/30 dark:bg-slate-900/30">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Task Reminder Settings</h4>

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-sm font-medium text-foreground">Notify Managers & Admins</span>
                      <p className="text-xs text-muted-foreground">Notify organization managers/admins of upcoming tasks.</p>
                    </div>
                    <SettingToggle
                      checked={Boolean(companySettings.notifyManagerForUpcomingTask)}
                      disabled={!organizationId || isCompanySaving}
                      onChange={() =>
                        setCompanySettings((prev) => ({
                          ...prev,
                          notifyManagerForUpcomingTask: !prev.notifyManagerForUpcomingTask,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Reminder Intervals</span>
                    <p className="text-xs text-muted-foreground mb-2">Select the intervals at which reminders should be sent before task scheduled execution.</p>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        { label: "24 Hours (1440m)", value: 1440 },
                        { label: "1 Hour (60m)", value: 60 },
                        { label: "15 Minutes (15m)", value: 15 },
                      ].map((item) => {
                        const isChecked = companySettings.intervals?.includes(item.value);
                        return (
                          <label key={item.value} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <input
                              type="checkbox"
                              checked={Boolean(isChecked)}
                              disabled={!organizationId || isCompanySaving}
                              onChange={() => {
                                setCompanySettings((prev) => {
                                  const currentIntervals = prev.intervals || [];
                                  const newIntervals = currentIntervals.includes(item.value)
                                    ? currentIntervals.filter((v) => v !== item.value)
                                    : [...currentIntervals, item.value];
                                  return {
                                    ...prev,
                                    intervals: newIntervals,
                                  };
                                });
                              }}
                              className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            />
                            <span className="text-sm font-medium text-foreground">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">These settings apply to the currently selected organization.</p>
                  <Button onClick={handleSaveCompanyPreferences} disabled={!organizationId || isCompanySaving}>
                    {isCompanySaving ? (
                      <>
                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Notification Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </AssignedModuleSettingPanel>
          </div>
        </TabsContent>

        <TabsContent value="assign-permissions" className="mt-0">
            {selectedRole ? (
                modules.length > 0 ? (
                  <div className="space-y-2">
                    {modules.map((module) => {
                      const isExpanded = module.isExpanded;
                      const actionCount = module.actions?.length || 0;
                      return (
                        <div key={module.id} className={`rounded-lg border transition-all duration-150 ${
                          isExpanded && actionCount > 0 ? 'border-primary/30' : 'border-slate-200 dark:border-slate-700'
                        }`}>
                          {actionCount === 0 ? (
                            /* Module with no actions — show a module-level Grant Access checkbox */
                            <div className="flex items-center justify-between px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                                  <Settings className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-sm font-medium text-foreground">{capitalizeWords(module.name)}</span>
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer select-none" onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedModules[module.id] || false}
                                  onChange={() =>
                                    setSelectedModules(prev => ({ ...prev, [module.id]: !prev[module.id] }))
                                  }
                                  className="w-3.5 h-3.5 cursor-pointer rounded"
                                />
                                <span className="text-xs text-muted-foreground">Grant Access</span>
                              </label>
                            </div>
                          ) : (
                          <>
                          <div
                            className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                              isExpanded ? 'bg-primary/5' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                            }`}
                            onClick={() => toggleModuleExpansion(module.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                isExpanded ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}>
                                <Settings className="w-3.5 h-3.5" />
                              </div>
                              <span className={`text-sm font-medium ${isExpanded ? 'text-primary' : 'text-foreground'}`}>{capitalizeWords(module.name)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                isExpanded ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                              }`}>{actionCount}</span>
                              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3.5 space-y-2.5">
                              {Array.isArray(module?.actions) && module?.actions.length > 0 ? (
                                module.actions.map((action: any) => (
                                  <div key={action.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Key className="w-3.5 h-3.5 text-primary" />
                                      <h4 className="text-xs font-semibold text-foreground">{capitalizeWords(action?.action)}</h4>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                                      {Array.isArray(action.subaction) && action.subaction.length > 0 ? (
                                        action.subaction.map((sub: any) => (
                                          <label key={sub.name} className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:bg-primary/[0.02] transition-colors cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={selectedSubActions[selectedRole]?.[action.id]?.includes(sub.id) || false}
                                              onChange={() => {
                                                setSelectedSubActions((prev) => {
                                                  const updated = JSON.parse(JSON.stringify(prev));
                                                  if (!updated[selectedRole]) updated[selectedRole] = {};
                                                  if (!updated[selectedRole][action.id]) updated[selectedRole][action.id] = [];
                                                  // Strip the "Full Access" marker (-1) when selecting specific sub-actions
                                                  const arr: number[] = updated[selectedRole][action.id].filter((id: number) => id !== -1);
                                                  if (arr.includes(sub.id)) {
                                                    updated[selectedRole][action.id] = arr.filter((id: number) => id !== sub.id);
                                                  } else {
                                                    updated[selectedRole][action.id] = [...arr, sub.id];
                                                  }
                                                  return updated;
                                                });
                                              }}
                                              className="w-3.5 h-3.5 cursor-pointer rounded"
                                            />
                                            <span className="text-xs text-foreground">{capitalizeWords(sub?.name)}</span>
                                          </label>
                                        ))
                                      ) : (
                                        <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-slate-100 dark:border-slate-800 hover:border-primary/20 hover:bg-primary/[0.02] transition-colors cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={selectedSubActions[selectedRole]?.[action.id]?.includes(-1) || false}
                                            onChange={() => {
                                              setSelectedSubActions((prev) => {
                                                const updated = JSON.parse(JSON.stringify(prev));
                                                if (!updated[selectedRole]) updated[selectedRole] = {};
                                                if (!updated[selectedRole][action.id]) updated[selectedRole][action.id] = [];
                                                const arr = updated[selectedRole][action.id];
                                                if (arr.includes(-1)) {
                                                  updated[selectedRole][action.id] = arr.filter((id: number) => id !== -1);
                                                } else {
                                                  arr.push(-1);
                                                }
                                                return updated;
                                              });
                                            }}
                                            className="w-3.5 h-3.5 cursor-pointer rounded"
                                          />
                                          <span className="text-xs text-foreground">Full Access</span>
                                        </label>
                                      )}
                                    </div>

                                    {Array.isArray(action.permissions) && action.permissions.length > 0 && (
                                      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        {action.permissions.map((perm: string, idx: number) => {
                                          const selected = rolePermissions[selectedRole]?.[action.id]?.includes(perm);
                                          return (
                                            <label key={idx} className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={!!selected}
                                                onChange={() => {
                                                  setRolePermissions((prev) => {
                                                    const updated = { ...prev };
                                                    if (!updated[selectedRole!]) updated[selectedRole!] = {};
                                                    if (!updated[selectedRole!]![action.id]) updated[selectedRole!]![action.id] = [];
                                                    const perms = updated[selectedRole!]![action.id];
                                                    if (perms.includes(perm)) {
                                                      updated[selectedRole!]![action.id] = perms.filter((p) => p !== perm);
                                                    } else {
                                                      perms.push(perm);
                                                    }
                                                    return updated;
                                                  });
                                                }}
                                                className="w-3.5 h-3.5 rounded"
                                              />
                                              <span className="text-xs text-foreground">{perm}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-xs text-muted-foreground py-4">No actions available</p>
                              )}
                            </div>
                          )}
                          </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-14">
                    <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2.5">
                      <Key className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">No Modules Available</h3>
                    <p className="text-xs text-muted-foreground">No modules are available for permission assignment.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-14">
                  <div className="w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2.5">
                    <Key className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Select a Role</h3>
                  <p className="text-xs text-muted-foreground">Choose a role from the dropdown above to assign permissions.</p>
                </div>
              )}
        </TabsContent>
          </div>
        </div>
      </Tabs>



      {/* Add Role Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Add New Role</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="roleName" className="text-xs font-medium text-foreground">
                Role Name
              </Label>
              <Select value={newRoleName} onValueChange={setNewRoleName}>
                <SelectTrigger id="roleName" className="h-9 text-sm">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {masterRoles
                    .filter((role) => !roles.some((r: any) => r.name === role.value))
                    .map((role) => (
                      <SelectItem key={role.id} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsModalOpen(false); setNewRoleName(''); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleAddRole(newRoleName)}
              disabled={!newRoleName.trim()}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleAccessRights;
