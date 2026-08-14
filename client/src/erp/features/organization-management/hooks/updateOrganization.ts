import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { updateOrganization } from "../api";

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateOrganization(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
    },

    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization!",
        variant: "destructive",
      });
    },
  });
};
