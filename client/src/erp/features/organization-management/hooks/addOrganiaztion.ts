import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addOrganization } from "../api";
import { useToast } from "@/hooks/use-toast";

export const useAddOrganiztion = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: addOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
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

