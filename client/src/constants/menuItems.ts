// src/constants/menuItems.ts
import { Bell, Building2, CalendarDays, Compass, FileBarChart, Home, LayoutDashboard, ShieldCheck, Ticket, Users, UserCog } from "lucide-react";

type MenuItem = {
  path: string;
  icon: any;
  label: string;
  exact?: boolean;
  badge?: number;
  children?: MenuItem[];
};

export const allMenuItems: MenuItem[] = [
  { path: "/", icon: Home, label: "Dashboard", exact: true },
  { path: "/platform-dashboard", icon: ShieldCheck, label: "Platform Dashboard", exact: true },
  { path: "/organizations/new", icon: Building2, label: "Organizations", exact: true },
  { path: "/users", icon: Users, label: "User Management", exact: true },
  { path: "/acl-managemnt", icon: UserCog, label: "ACL Management" },
  { path: "/notifications", icon: Bell, label: "Notifications", exact: true },
];

/**
 * Member-facing navigation — every active member sees these regardless of
 * role, unlike the admin items above which are gated by the ACL module
 * grid. Force-appended in roleAccess.ts rather than routed through
 * getCustomMenus, since community roles (internal_member/external_member)
 * never receive RoleModuleAccess rows (see community-svc's coarse
 * role-based guards instead of the full ACL matrix).
 */
export const memberMenuItems: MenuItem[] = [
  { path: "/announcements", icon: Bell, label: "Announcements", exact: true },
  { path: "/explore", icon: Compass, label: "Explore", exact: true },
  { path: "/my-activities", icon: Ticket, label: "My Activities", exact: true },
  { path: "/calendar", icon: CalendarDays, label: "Calendar", exact: true },
  { path: "/directory", icon: Users, label: "Directory", exact: true },
];

/**
 * Org-admin-only nav (dashboard/reports) — force-appended like
 * memberMenuItems, but scoped to super_admin/core_committee only in
 * roleAccess.ts, since internal_member/external_member shouldn't see org
 * financials or reports.
 */
export const orgAdminMenuItems: MenuItem[] = [
  { path: "/org-dashboard", icon: LayoutDashboard, label: "Org Dashboard", exact: true },
  { path: "/reports", icon: FileBarChart, label: "Reports", exact: true },
];
