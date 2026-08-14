import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addOrganizationRole } from "../api";
import { useToast } from "@/hooks/use-toast";

export const useAddOrganiztionRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: addOrganizationRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-organization"] });
      toast({
          title: "Success",
          description: "Organiaztion added in successfully",
        });
    },
     onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed !",
          variant: "destructive",
        });
      },
  });
};

