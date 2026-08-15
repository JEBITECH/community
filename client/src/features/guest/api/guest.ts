import { apiRequest } from "@/lib/queryClient";
import { SponsorshipNeed } from "@/features/member/api/donations";

export interface GuestInfo {
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
}

export interface PublicOrganization {
  organization_id: number;
  organization_name: string;
  organization_type: string;
  organization_logo?: string;
  membership_model: string;
  subdomain: string;
  themeConfig?: { primary_color?: string; secondary_color?: string } | null;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getOrganizationBySubdomain = (subdomain: string) =>
  apiRequest("GET", `/auth/organizations/by-subdomain/${encodeURIComponent(subdomain)}`).then((r) => json<PublicOrganization>(r));

export const getPublicSponsorshipNeeds = (eventId: string) =>
  apiRequest("GET", `/community/public/events/${eventId}/sponsorship-needs`).then((r) => json<SponsorshipNeed[]>(r));

export const guestCreateParticipation = (data: {
  event_id: string;
  event_component_id?: string;
  type: "join" | "book";
  seats_requested?: number;
  guest: GuestInfo;
}) => apiRequest("POST", "/community/public/participations", data).then((r) => json<{ id: string }>(r));

export const guestCreateDonation = (data: {
  event_id: string;
  event_component_id?: string;
  amount: number;
  purpose?: string;
  guest: GuestInfo;
}) => apiRequest("POST", "/community/public/donations", data).then((r) => json<{ id: string }>(r));

export const guestCreateSponsorship = (data: { sponsorship_need_id: string; amount_pledged: number; guest: GuestInfo }) =>
  apiRequest("POST", "/community/public/sponsorships", data).then((r) => json<{ id: string }>(r));
