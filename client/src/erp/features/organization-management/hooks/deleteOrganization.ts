import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { deleteOrganization } from "../api";

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ( id: number ) => deleteOrganization(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });
    },

    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization!",
        variant: "destructive",
      });
    },
  });
};