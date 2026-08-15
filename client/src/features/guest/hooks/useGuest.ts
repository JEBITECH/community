import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrganizationBySubdomain,
  getPublicSponsorshipNeeds,
  guestCreateParticipation,
  guestCreateDonation,
  guestCreateSponsorship,
} from "../api/guest";
import { useToast } from "@/hooks/use-toast";

export const useGuestOrganization = (subdomain?: string) =>
  useQuery({ queryKey: ["guest-organization", subdomain], queryFn: () => getOrganizationBySubdomain(subdomain!), enabled: !!subdomain });

export const useGuestSponsorshipNeeds = (eventId?: string) =>
  useQuery({ queryKey: ["guest-sponsorship-needs", eventId], queryFn: () => getPublicSponsorshipNeeds(eventId!), enabled: !!eventId });

export const useGuestParticipation = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: guestCreateParticipation,
    onError: (error: Error) => {
      toast({ title: "Couldn't register", description: error.message, variant: "destructive" });
    },
  });
};

export const useGuestDonation = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: guestCreateDonation,
    onError: (error: Error) => {
      toast({ title: "Couldn't submit donation", description: error.message, variant: "destructive" });
    },
  });
};

export const useGuestSponsorship = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: guestCreateSponsorship,
    onSuccess: () => {
      if (eventId) queryClient.invalidateQueries({ queryKey: ["guest-sponsorship-needs", eventId] });
    },
    onError: (error: Error) => {
      toast({ title: "Couldn't submit pledge", description: error.message, variant: "destructive" });
    },
  });
};
