import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDirectory, getPendingMembers, approveMember, rejectMember } from "../api/members";
import { useToast } from "@/hooks/use-toast";

export const useDirectory = () => useQuery({ queryKey: ["members-directory"], queryFn: getDirectory });

export const usePendingMembers = (enabled: boolean) =>
  useQuery({ queryKey: ["members-pending"], queryFn: getPendingMembers, enabled });

export const useApproveMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: approveMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members-pending"] });
      queryClient.invalidateQueries({ queryKey: ["members-directory"] });
      toast({ title: "Member approved" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useRejectMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: rejectMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members-pending"] });
      toast({ title: "Member request rejected" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
