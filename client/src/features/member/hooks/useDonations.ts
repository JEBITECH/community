import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDonation,
  getMyDonations,
  getEventDonations,
  recordDonationPayment,
  getSponsorshipNeeds,
  createSponsorshipNeed,
  createSponsorship,
  getMySponsorships,
  getEventSponsorships,
  recordSponsorshipPayment,
} from "../api/donations";
import { useToast } from "@/hooks/use-toast";

export const useMyDonations = () => useQuery({ queryKey: ["my-donations"], queryFn: getMyDonations });

export const useEventDonations = (eventId?: string) =>
  useQuery({ queryKey: ["event-donations", eventId], queryFn: () => getEventDonations(eventId!), enabled: !!eventId });

export const useCreateDonation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: createDonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-donations"] });
      toast({ title: "Thank you!", description: "Your donation pledge was recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't submit donation", description: error.message, variant: "destructive" });
    },
  });
};

export const useRecordDonationPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { payment_status: "recorded" | "failed"; payment_method?: string } }) =>
      recordDonationPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-donations"] });
      queryClient.invalidateQueries({ queryKey: ["my-donations"] });
      toast({ title: "Payment recorded" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useSponsorshipNeeds = (eventId?: string) =>
  useQuery({ queryKey: ["sponsorship-needs", eventId], queryFn: () => getSponsorshipNeeds(eventId!), enabled: !!eventId });

export const useCreateSponsorshipNeed = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: createSponsorshipNeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-needs", eventId] });
      toast({ title: "Sponsorship opportunity created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};

export const useCreateSponsorship = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: createSponsorship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-needs", eventId] });
      queryClient.invalidateQueries({ queryKey: ["my-sponsorships"] });
      toast({ title: "Pledge submitted", description: "Thank you for sponsoring!" });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't submit pledge", description: error.message, variant: "destructive" });
    },
  });
};

export const useMySponsorships = () => useQuery({ queryKey: ["my-sponsorships"], queryFn: getMySponsorships });

export const useEventSponsorships = (eventId?: string) =>
  useQuery({ queryKey: ["event-sponsorships", eventId], queryFn: () => getEventSponsorships(eventId!), enabled: !!eventId });

export const useRecordSponsorshipPayment = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { payment_status: "recorded" | "failed"; payment_method?: string } }) =>
      recordSponsorshipPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-needs", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-sponsorships", eventId] });
      queryClient.invalidateQueries({ queryKey: ["my-sponsorships"] });
      toast({ title: "Payment recorded" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
};
