import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDiscussionTopic,
  deleteDiscussionTopic,
  getEventDiscussions,
  moderateDiscussionTopic,
  updateDiscussionTopic,
} from "../api/discussions";
import { useToast } from "@/hooks/use-toast";

const discussionKey = (eventId?: string) => ["event-discussions", eventId] as const;

export const useEventDiscussions = (eventId?: string) =>
  useQuery({
    queryKey: discussionKey(eventId),
    queryFn: () => getEventDiscussions(eventId!),
    enabled: !!eventId,
  });

export const useCreateDiscussionTopic = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { heading: string; body?: string }) => createDiscussionTopic(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(eventId) });
      toast({ title: "Discussion started" });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't start discussion", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateDiscussionTopic = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; heading?: string; body?: string | null }) =>
      updateDiscussionTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(eventId) });
      toast({ title: "Discussion updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't update discussion", description: error.message, variant: "destructive" });
    },
  });
};

export const useModerateDiscussionTopic = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; is_pinned?: boolean; is_closed?: boolean }) =>
      moderateDiscussionTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(eventId) });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't update discussion status", description: error.message, variant: "destructive" });
    },
  });
};

export const useDeleteDiscussionTopic = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteDiscussionTopic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(eventId) });
      toast({ title: "Discussion deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't delete discussion", description: error.message, variant: "destructive" });
    },
  });
};
