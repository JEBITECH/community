import { useQuery } from "@tanstack/react-query";
import { getOrganizations, getModulesWithInternal } from "../api/organizations";

export const useOrganizations = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
};

export const useGetModulesWithInternal = () => {
  return useQuery({
    queryKey: ["modules-with-internal"],
    queryFn: getModulesWithInternal,
  });
};
