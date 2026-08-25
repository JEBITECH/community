import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createParticipation,
  getMyParticipations,
  cancelParticipation,
  getComponentAvailability,
  CreateParticipationInput,
} from "../api/participations";
import { useToast } from "@/hooks/use-toast";

export const useMyParticipations = (type?: string) =>
  useQuery({
    queryKey: ["my-participations", type],
    queryFn: () => getMyParticipations(type),
  });

export const useComponentAvailability = (componentId?: string) =>
  useQuery({
    queryKey: ["component-availability", componentId],
    queryFn: () => getComponentAvailability(componentId!),
    enabled: !!componentId,
  });

export const useCreateParticipation = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: CreateParticipationInput) => createParticipation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-participations"] });
      if (eventId) queryClient.invalidateQueries({ queryKey: ["community-event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["component-availability"] });
      toast({ title: "You're in!", description: "Your registration was confirmed." });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't register", description: error.message || "Please try again.", variant: "destructive" });
    },
  });
};

export const useCancelParticipation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => cancelParticipation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-participations"] });
      queryClient.invalidateQueries({ queryKey: ["component-availability"] });
      toast({ title: "Cancelled", description: "Your registration was cancelled." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to cancel", variant: "destructive" });
    },
  });
};
