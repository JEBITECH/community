import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addRoleModuleAccess } from "../api";
import { useToast } from "@/hooks/use-toast";

export const useAddRoleModuleAccess = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: addRoleModuleAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-module"] });
      toast({
          title: "Success",
          description: "Role module access added in successfully",
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

