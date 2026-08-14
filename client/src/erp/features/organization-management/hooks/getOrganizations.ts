import { useQuery } from "@tanstack/react-query";
import { getOrganizations } from "../api";

export const useOrganizations = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: getOrganizations,
    enabled,
    staleTime: 0,               
    refetchOnMount: "always",    
    refetchOnWindowFocus: false  
  });
};
