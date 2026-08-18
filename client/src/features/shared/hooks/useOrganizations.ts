import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getOrganizations, getModulesWithInternal, createOrganization, CreateOrganizationInput } from "../api/organizations";

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

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: CreateOrganizationInput) => createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create organization", variant: "destructive" });
    },
  });
};
