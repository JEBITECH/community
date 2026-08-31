import { apiRequest } from "@/lib/queryClient";

export type ParticipationType = "join" | "book" | "donate" | "sponsor" | "volunteer";
export type ParticipationStatus = "active" | "cancelled" | "attended" | "no_show";

export interface Participation {
  id: string;
  organization_id: number;
  event_id: string;
  event_component_id?: string | null;
  membership_id: string;
  type: ParticipationType;
  status: ParticipationStatus;
  qr_code_token: string;
  attended_at?: string | null;
  createdAt: string;
  // Only present on 'book' rows from GET /participations/me — see AttendeeType/BookingAttendee below.
  booking?: { id: string; seats_requested: number; attendees: BookingAttendee[] };
}

export type AttendeeType = "self" | "family" | "other";

export interface AttendeeInput {
  attendee_type: AttendeeType;
  name?: string;
  membership_id?: string;
}

export interface BookingAttendee {
  id: string;
  attendee_type: AttendeeType;
  name: string;
  membership_id?: string | null;
}

export interface CreateParticipationInput {
  event_id: string;
  event_component_id?: string;
  type: "join" | "book";
  seats_requested?: number;
  attendees?: AttendeeInput[];
}

export interface Availability {
  capacity: number | null;
  used: number;
  available: number | null;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const createParticipation = (data: CreateParticipationInput) =>
  apiRequest("POST", "/community/participations", data).then((r) => json<Participation>(r));

export const getMyParticipations = (type?: string) =>
  apiRequest("GET", `/community/participations/me${type ? `?type=${type}` : ""}`).then((r) => json<Participation[]>(r));

export const cancelParticipation = (id: string) =>
  apiRequest("POST", `/community/participations/${id}/cancel`).then((r) => json<Participation>(r));

export const getComponentAvailability = (componentId: string) =>
  apiRequest("GET", `/community/components/${componentId}/availability`).then((r) => json<Availability>(r));

export const attendByQrToken = (qrCodeToken: string) =>
  apiRequest("POST", "/community/participations/attend", { qr_code_token: qrCodeToken }).then((r) => json<Participation>(r));
