import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getEventComments, getMyComments, createComment, updateComment, deleteComment, reportComment, moderateComment } from "../api/comments";
import { useToast } from "@/hooks/use-toast";

export const useMyComments = () => useQuery({ queryKey: ["my-comments"], queryFn: getMyComments });

export const useEventComments = (eventId?: string) =>
  useQuery({ queryKey: ["event-comments", eventId], queryFn: () => getEventComments(eventId!), enabled: !!eventId });

export const useCreateComment = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: { body: string; parent_comment_id?: string }) => createComment(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't post comment", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateComment = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => updateComment(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't edit comment", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteComment = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't delete comment", description: error.message, variant: "destructive" });
    },
  });
};

export const useReportComment = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: reportComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventId] });
      toast({ title: "Reported", description: "Thanks — organizers will review this." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useModerateComment = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "visible" | "hidden" }) => moderateComment(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-comments", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
