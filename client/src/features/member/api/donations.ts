import { apiRequest } from "@/lib/queryClient";

export type PaymentStatus = "pending" | "recorded" | "failed";
export type PaymentMethod = "cash" | "upi" | "bank_transfer" | "other";

export interface Donation {
  id: string;
  participation_id: string;
  amount: number;
  currency: string;
  purpose: "event" | "component" | "general";
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  receipt_number?: string;
  recorded_at?: string;
  createdAt: string;
}

export interface SponsorshipNeed {
  id: string;
  organization_id: number;
  event_id: string;
  event_component_id?: string;
  title: string;
  description?: string;
  target_amount: number;
  amount_raised: number;
  status: "open" | "fulfilled" | "closed";
  createdAt: string;
}

export interface Sponsorship {
  id: string;
  participation_id: string;
  sponsorship_need_id: string;
  amount_pledged: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  receipt_number?: string;
  createdAt: string;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const createDonation = (data: { event_id: string; event_component_id?: string; amount: number; purpose?: string }) =>
  apiRequest("POST", "/community/donations", data).then((r) => json<Donation>(r));

export const getMyDonations = () =>
  apiRequest("GET", "/community/donations/me").then((r) => json<(Donation & { event_id: string; event_name: string })[]>(r));

export const getEventDonations = (eventId: string) =>
  apiRequest("GET", `/community/events/${eventId}/donations`).then((r) => json<Donation[]>(r));

export const recordDonationPayment = (id: string, data: { payment_status: "recorded" | "failed"; payment_method?: string }) =>
  apiRequest("PATCH", `/community/donations/${id}/record-payment`, data).then((r) => json<Donation>(r));

export const getSponsorshipNeeds = (eventId: string) =>
  apiRequest("GET", `/community/events/${eventId}/sponsorship-needs`).then((r) => json<SponsorshipNeed[]>(r));

export const createSponsorshipNeed = (data: { event_id: string; event_component_id?: string; title: string; description?: string; target_amount: number }) =>
  apiRequest("POST", "/community/sponsorship-needs", data).then((r) => json<SponsorshipNeed>(r));

export const createSponsorship = (data: { sponsorship_need_id: string; amount_pledged: number }) =>
  apiRequest("POST", "/community/sponsorships", data).then((r) => json<Sponsorship>(r));

export const getMySponsorships = () =>
  apiRequest("GET", "/community/sponsorships/me").then((r) => json<(Sponsorship & { event_id: string; event_name: string })[]>(r));

export const getEventSponsorships = (eventId: string) =>
  apiRequest("GET", `/community/events/${eventId}/sponsorships`).then((r) => json<Sponsorship[]>(r));

export const recordSponsorshipPayment = (id: string, data: { payment_status: "recorded" | "failed"; payment_method?: string }) =>
  apiRequest("PATCH", `/community/sponsorships/${id}/record-payment`, data).then((r) => json<Sponsorship>(r));
