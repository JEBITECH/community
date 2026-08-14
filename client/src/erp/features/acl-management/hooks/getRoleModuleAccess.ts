import { useQuery } from "@tanstack/react-query";
import { getRoleModuleAccessByOrganizationId } from "../api";

export const useGetRoleModuleAccessByOrganization = (organizationId: string, roleId: string) => {
  return useQuery({
    queryKey: ["oragnizations_roles_modules", organizationId, roleId],
    queryFn: () => getRoleModuleAccessByOrganizationId(Number(organizationId), Number(roleId)),
  });
};
