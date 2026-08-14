export interface CreateSuperAdminDto {
  first_name: string;
  email: string;
  new_email?: string;
  user_role: string;
  phone?: string;
}

export interface CreatePmsDto {
  is_archived: boolean;
  pms_id?: number;
  pms_name: string;
  client_id: string;
  pms_client_secret: string;
  pms_location?: string | undefined;
  pms_account?: string | undefined;
  pms_url: string;
}

export interface ThemeConfigDto {
  primary_color: string;
  secondary_color: string;
  font_family: string;
}
export interface PropertyLocation {
  property_name: string;
  property_location: string;
}
export interface CreateOrganizationDto {
  organization_name: string;
  organization_email: string;
  organization_location: string;
  organization_timezone?: string;
  organization_contact_info?: string;
  organization_property_locations?: PropertyLocation[];
  super_admin: CreateSuperAdminDto;
  pms_master: CreatePmsDto[];
  module_ids: number[];
  module_subscriptions: any[];
  themeConfig: ThemeConfigDto;
  organization_logo?: string | null;
  is_franchisor?: boolean;
  parent_org_id?: number | null;
}
export interface ModuleSubscription {
  module_id: number;
  term: "short" | "long";
  price: string;
  startDate: string;
  endDate: string;
}
export interface Pms {
  is_archived: boolean;
  pms_account?: string;
  client_id?: string;
  pms_location?: string;
  pms_name: string;
  pms_client_secret?: string;
  pms_url?: string;
}
export interface Module {
  id: number;
  name: string;
  status: boolean,
  createdAt: Date,
  updatedAt: Date,
  updatedBy?: number;
  createdBy?: number;
}
export interface ThemeTypes {
  id: number;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: number;
  createdBy?: number;
}
export interface OrganizationData {
  organization_id?: number;
  organization_name: string;
  organization_location: string;
  organization_timezone: string;
  organization_contact_info: string;
  organization_property_locations: PropertyLocation[];
  super_admin_id?: number;
  organization_email: string;
  super_admin_name: string;
  super_admin_email: string;
  super_admin_phone: string;
  super_admin_role: string;
  is_archived: boolean;
  moduleSubscriptions: ModuleSubscription[];
  pms_list: Pms[];
  modules: Module[];
  themeConfig?: ThemeTypes;
  organization_logo?: string;
  is_franchisor?: boolean;
  parent_org_id?: number | null;
}