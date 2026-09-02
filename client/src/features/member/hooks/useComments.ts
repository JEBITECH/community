import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createComment,
  deleteComment,
  getEventComments,
  getMyComments,
  moderateComment,
  reportComment,
  updateComment,
} from "../api/comments";
import { useToast } from "@/hooks/use-toast";

const commentKey = (eventId?: string, topicId?: string) => [
  "event-comments",
  eventId,
  topicId ?? null,
] as const;

export const useMyComments = () => useQuery({ queryKey: ["my-comments"], queryFn: getMyComments });

export const useEventComments = (eventId?: string, discussionTopicId?: string) =>
  useQuery({
    queryKey: commentKey(eventId, discussionTopicId),
    queryFn: () => getEventComments(eventId!, { discussionTopicId }),
    enabled: !!eventId,
  });

export const useCreateComment = (eventId: string, discussionTopicId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { body: string; parent_comment_id?: string }) =>
      createComment(eventId, { ...data, discussion_topic_id: discussionTopicId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKey(eventId, discussionTopicId) });
      if (discussionTopicId) {
        queryClient.invalidateQueries({ queryKey: ["event-discussions", eventId] });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't post comment", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateComment = (eventId: string, discussionTopicId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => updateComment(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKey(eventId, discussionTopicId) });
      if (discussionTopicId) {
        queryClient.invalidateQueries({ queryKey: ["event-discussions", eventId] });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't edit comment", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteComment = (eventId: string, discussionTopicId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKey(eventId, discussionTopicId) });
      if (discussionTopicId) {
        queryClient.invalidateQueries({ queryKey: ["event-discussions", eventId] });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't delete comment", description: error.message, variant: "destructive" });
    },
  });
};

export const useReportComment = (eventId: string, discussionTopicId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: reportComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKey(eventId, discussionTopicId) });
      toast({ title: "Reported", description: "Thanks — organizers will review this." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useModerateComment = (eventId: string, discussionTopicId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "visible" | "hidden" }) => moderateComment(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKey(eventId, discussionTopicId) });
      if (discussionTopicId) {
        queryClient.invalidateQueries({ queryKey: ["event-discussions", eventId] });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
