import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from "../api/announcements";
import { useToast } from "@/hooks/use-toast";

const KEY = ["announcements"] as const;

export const useAnnouncements = (organizationId?: number | null) =>
  useQuery({
    queryKey: [...KEY, organizationId ?? null],
    queryFn: getAnnouncements,
    enabled: organizationId != null,
  });

export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast({ title: "Announcement published" });
    },
    onError: (error: Error) => toast({ title: "Couldn't publish announcement", description: error.message, variant: "destructive" }),
  });
};

export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof updateAnnouncement>[1]) => updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast({ title: "Announcement updated" });
    },
    onError: (error: Error) => toast({ title: "Couldn't update announcement", description: error.message, variant: "destructive" }),
  });
};

export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      toast({ title: "Announcement deleted" });
    },
    onError: (error: Error) => toast({ title: "Couldn't delete announcement", description: error.message, variant: "destructive" }),
  });
};
