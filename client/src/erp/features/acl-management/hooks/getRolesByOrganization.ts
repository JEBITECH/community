import { useQuery } from "@tanstack/react-query";
import { getRoleByOrganizationId } from "../api";

export const useGetRolesByOrganization = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["oragnizations_roles", id],
    queryFn: () => getRoleByOrganizationId(Number(id)),
    enabled: options?.enabled ?? !!id,
  });
};
