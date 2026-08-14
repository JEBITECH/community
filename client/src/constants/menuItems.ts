// src/constants/menuItems.ts
import { Bell, Home, Users, UserCog, Building } from "lucide-react";

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
  { path: "/organizations", icon: Building, label: "Organization Management" },
  { path: "/users", icon: Users, label: "User Management", exact: true },
  { path: "/acl-managemnt", icon: UserCog, label: "ACL Management" },
  { path: "/notifications", icon: Bell, label: "Notifications", exact: true },
];
