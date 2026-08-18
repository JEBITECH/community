import { apiRequest } from "@/lib/queryClient";

export type OrganizationType = "society" | "educational_institution";
export type OrganizationPlan = "free" | "community" | "professional" | "enterprise";
export type MembershipModel = "open" | "approval_required" | "invite_only";

export interface OrganizationUserInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface ThemeConfigInput {
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
}

export interface CreateOrganizationInput {
  organization_name: string;
  organization_email?: string;
  organization_location?: string;
  organization_timezone?: string;
  organization_contact_info?: string;
  organization_type: OrganizationType;
  subdomain: string;
  membership_model: MembershipModel;
  plan: OrganizationPlan;
  super_admin: OrganizationUserInput;
  module_ids: number[];
  themeConfig?: ThemeConfigInput;
  organization_logo?: string;
}

export interface ModuleAction {
  action_id: number;
  name: string;
  status: boolean;
}

export interface ModuleListItem {
  module_id: number;
  name: string;
  status: boolean;
  is_internal: boolean;
  action_list?: ModuleAction[];
}

export const getOrganizations = () => apiRequest("GET", "/auth/organizations").then(res => res.json());
export const getOrganizationById = (id: number) => apiRequest("GET", `/auth/organizations/${id}`).then(res => res.json());
export const checkSubdomainUnique = (subdomain: string) => apiRequest("GET", `/auth/organizations/check-subdomain/${subdomain}`).then(res => res.json());
export const createOrganization = (data: CreateOrganizationInput) => apiRequest("POST", "/auth/organizations", data).then(res => res.json());
export const updateOrganization = (id: number, data: Partial<CreateOrganizationInput>) => apiRequest("PATCH", `/auth/organizations/${id}`, data).then(res => res.json());
export const suspendOrganization = (id: number) => apiRequest("PATCH", `/auth/organizations/${id}/suspend`).then(res => res.json());
export const reactivateOrganization = (id: number) => apiRequest("PATCH", `/auth/organizations/${id}/reactivate`).then(res => res.json());
export const archiveOrganization = (id: number) => apiRequest("PATCH", `/auth/organizations/archive/${id}`).then(res => res.json());
export const restoreOrganization = (id: number) => apiRequest("PATCH", `/auth/organizations/restore/${id}`).then(res => res.json());
export const getModules = () => apiRequest("GET", "/auth/modules").then(res => res.json());
export const getModulesWithInternal = (): Promise<{ module_list: ModuleListItem[] }> =>
  apiRequest("GET", "/auth/modules?include_internal=true").then(res => res.json());
