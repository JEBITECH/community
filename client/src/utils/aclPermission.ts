import { ModuleAccess } from "@/erp/features/auth/type";

export const normalizeAclName = (value?: string | null) => (value ?? "").trim().toLowerCase();

export function hasModuleAccess(modules: ModuleAccess[], moduleName: string): boolean {
  const normalizedModuleName = normalizeAclName(moduleName);
  return modules.some(
    (module) => module.status && normalizeAclName(module.name) === normalizedModuleName,
  );
}

export function hasActionAccess(
  modules: ModuleAccess[],
  moduleName: string,
  actionName: string,
): boolean {
  const mod = modules.find(
    (module) => module.status && normalizeAclName(module.name) === normalizeAclName(moduleName),
  );

  if (!mod) return false;

  // Module-level grant (no action rows) allows every action under the module.
  if (!mod.action_list?.length) return true;

  return mod.action_list.some(
    (action) => action.status && normalizeAclName(action.name) === normalizeAclName(actionName),
  );
}
