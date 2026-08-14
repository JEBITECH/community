import { useQuery } from "@tanstack/react-query";
import { getOrganizationById } from "../api";

export const useOrganizationById = (id: string) => {
  return useQuery({
    queryKey: ["organization", id], 
    queryFn: () => getOrganizationById(Number(id)),
    enabled: !!id, 
  });
};