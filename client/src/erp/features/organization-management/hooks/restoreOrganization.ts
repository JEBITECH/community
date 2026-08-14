import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { restoreOrganization } from "../api";

export const useRestoreOrganization = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ( id: number ) => restoreOrganization(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast({
        title: "Success",
        description: "Organization restored successfully",
      });
    },

    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore organization!",
        variant: "destructive",
      });
    },
  });
};