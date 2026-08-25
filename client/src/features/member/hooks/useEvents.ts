import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEvents,
  getEvent,
  getEventSchedule,
  createEvent,
  updateEvent,
  publishEvent,
  cancelEvent,
  createEventDay,
  updateEventDay,
  deleteEventDay,
  createEventComponent,
  updateEventComponent,
  deleteEventComponent,
  getPublicEvents,
  getPublicEvent,
  CreateEventInput,
  UpdateEventInput,
  CreateEventDayInput,
  CreateEventComponentInput,
} from "../api/events";
import { useToast } from "@/hooks/use-toast";

export const useEvents = (params?: { status?: string; event_type?: string }) =>
  useQuery({
    queryKey: ["community-events", params],
    queryFn: () => getEvents(params),
  });

export const useEvent = (id?: string) =>
  useQuery({
    queryKey: ["community-event", id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

export const useEventSchedule = (id?: string) =>
  useQuery({
    queryKey: ["community-event-schedule", id],
    queryFn: () => getEventSchedule(id!),
    enabled: !!id,
  });

export const usePublicEvents = (subdomain?: string) =>
  useQuery({
    queryKey: ["public-events", subdomain],
    queryFn: () => getPublicEvents(subdomain!),
    enabled: !!subdomain,
  });

export const usePublicEvent = (id?: string) =>
  useQuery({
    queryKey: ["public-event", id],
    queryFn: () => getPublicEvent(id!),
    enabled: !!id,
  });

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: CreateEventInput) => createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-events"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create activity", variant: "destructive" });
    },
  });
};

export const useUpdateEvent = (id: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: UpdateEventInput) => updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-event", id] });
      queryClient.invalidateQueries({ queryKey: ["community-events"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update activity", variant: "destructive" });
    },
  });
};

export const usePublishEvent = (id: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => publishEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-event", id] });
      queryClient.invalidateQueries({ queryKey: ["community-events"] });
      toast({ title: "Published", description: "Your activity is now live." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to publish", variant: "destructive" });
    },
  });
};

export const useCancelEvent = (id: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: () => cancelEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-event", id] });
      queryClient.invalidateQueries({ queryKey: ["community-events"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to cancel", variant: "destructive" });
    },
  });
};

export const useCreateEventDay = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: CreateEventDayInput) => createEventDay(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["community-event-schedule", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to add day", variant: "destructive" });
    },
  });
};

export const useUpdateEventDay = (eventId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dayId, data }: { dayId: string; data: Partial<CreateEventDayInput> }) => updateEventDay(dayId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["community-event-schedule", eventId] });
    },
  });
};

export const useDeleteEventDay = (eventId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dayId: string) => deleteEventDay(dayId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["community-event-schedule", eventId] });
    },
  });
};

export const useCreateEventComponent = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ dayId, data }: { dayId: string; data: CreateEventComponentInput }) =>
      createEventComponent(dayId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["community-event-schedule", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to add activity", variant: "destructive" });
    },
  });
};

export const useUpdateEventComponent = (eventId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ componentId, data }: { componentId: string; data: Partial<CreateEventComponentInput> }) =>
      updateEventComponent(componentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["community-event-schedule", eventId] });
    },
  });
};

export const useDeleteEventComponent = (eventId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (componentId: string) => deleteEventComponent(componentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-event", eventId] });
      queryClient.invalidateQueries({ queryKey: ["community-event-schedule", eventId] });
    },
  });
};
