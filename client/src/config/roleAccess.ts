import { allMenuItems } from "@/constants/menuItems";
import { ModuleAccess } from "@/erp/features/auth/type";

// Roles
export type Role = "master_admin" | "super_admin" | "manager" | "custom_role";

type MenuItem = {
  path: string;
  icon: any;
  label: string;
  exact?: boolean;
  badge?: number;
  children?: MenuItem[];
};

const NOTIFICATIONS_PATH = "/notifications";
const ALWAYS_VISIBLE_ROLES: Role[] = ["master_admin", "super_admin", "manager"];

/**
 * Get menus for master admin — full static menu
 */
export const getMasterAdminMenus = (): MenuItem[] => allMenuItems;

/**
 * Get menus for custom roles with permission filtering for all modules
 */
export const getCustomMenus = (modules: ModuleAccess[]): MenuItem[] => {
  // Build a lookup: module name (lowercase) → module access data from BE
  const moduleByName = new Map(
    modules.filter(m => m.status).map(m => [m.name.toLowerCase(), m])
  );

  const applySubActionFilter = (
    action: { sub_action_list?: { sub_Action_id: number | null; name: string | null; status: boolean }[] },
    item: MenuItem
  ): MenuItem => {
    if (!item.children || item.children.length === 0) return item;

    const specificSubs = action.sub_action_list?.filter(s => s.sub_Action_id !== null && s.status) ?? [];

    if (specificSubs.length === 0) return { ...item, children: undefined };

    const kids = specificSubs
      .map(s => item.children!.find(c => c.label.toLowerCase() === (s.name ?? '').toLowerCase()))
      .filter(Boolean) as MenuItem[];

    return kids.length > 0 ? { ...item, children: kids } : item;
  };

  const result: MenuItem[] = [];

  for (const menuItem of allMenuItems) {
    const moduleName = menuItem.label.toLowerCase();
    const m = moduleByName.get(moduleName);

    if (!m) continue; // not granted by BE → skip

    if (!menuItem.children || menuItem.children.length === 0) {
      result.push(menuItem);
      continue;
    }

    const filteredChildren: MenuItem[] = [];

    if (!m.action_list?.length) {
      filteredChildren.push(...menuItem.children!);
    } else {
      m.action_list.filter(a => a.status).forEach(action => {
        const child = menuItem.children!.find(c => c.label.toLowerCase() === action.name.toLowerCase());
        if (child) filteredChildren.push(applySubActionFilter(action, child));
      });
    }

    if (filteredChildren.length > 0) result.push({ ...menuItem, children: filteredChildren });
  }

  return result;
};

/**
 * Main function to get menus based on role
 */
export const getMenusByRole = (role: Role, modules: ModuleAccess[]): MenuItem[] => {
  const roleMenus = (() => {
    switch (role) {
      case "master_admin":
        return getMasterAdminMenus();
      case "super_admin":
      case "manager":
      case "custom_role":
        return getCustomMenus(modules);
      default:
        return [];
    }
  })();

  const notificationMenu = allMenuItems.find((item) => item.path === NOTIFICATIONS_PATH);

  if (
    notificationMenu &&
    ALWAYS_VISIBLE_ROLES.includes(role) &&
    !roleMenus.some((item) => item.path === NOTIFICATIONS_PATH)
  ) {
    return [...roleMenus, notificationMenu];
  }

  return roleMenus;
};
