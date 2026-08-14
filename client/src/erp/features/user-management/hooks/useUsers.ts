import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api";

export const useUsers = (page = 1, limit = 10, organizationId?: number | null, search?: string) => {
  return useQuery({
    queryKey: ["users", page, limit, organizationId, search],
    queryFn: () => getUsers(page, limit, organizationId, search),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false
  });
};

