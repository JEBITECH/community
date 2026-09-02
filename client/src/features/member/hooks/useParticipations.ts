import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createParticipation,
  getMyParticipations,
  cancelParticipation,
  updateParticipation,
  getComponentAvailability,
  getComponentReport,
  CreateParticipationInput,
  UpdateParticipationInput,
} from "../api/participations";
import { useToast } from "@/hooks/use-toast";

export const useMyParticipations = (type?: string, registrationMethod?: "join" | "participate" | "book") =>
  useQuery({
    queryKey: ["my-participations", type, registrationMethod],
    queryFn: () => getMyParticipations(type, registrationMethod),
  });

export const useComponentAvailability = (componentId?: string) =>
  useQuery({
    queryKey: ["component-availability", componentId],
    queryFn: () => getComponentAvailability(componentId!),
    enabled: !!componentId,
  });

/** Admin-only: who joined vs participated (with beneficiary detail) vs
 * booked, for a single schedule item. */
export const useComponentReport = (componentId?: string) =>
  useQuery({
    queryKey: ["component-report", componentId],
    queryFn: () => getComponentReport(componentId!),
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
      queryClient.invalidateQueries({ queryKey: ["component-report"] });
      toast({ title: "You're in!", description: "Your registration was confirmed." });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't register", description: error.message || "Please try again.", variant: "destructive" });
    },
  });
};

export const useUpdateParticipation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateParticipationInput }) => updateParticipation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-participations"] });
      queryClient.invalidateQueries({ queryKey: ["component-availability"] });
      queryClient.invalidateQueries({ queryKey: ["component-report"] });
      toast({ title: "Participation updated", description: "Your participant details were saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't update participation", description: error.message || "Please try again.", variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["component-report"] });
      toast({ title: "Cancelled", description: "Your registration was cancelled." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to cancel", variant: "destructive" });
    },
  });
};
