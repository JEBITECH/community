import { apiRequest } from "@/lib/queryClient";

export type ParticipationType = "join" | "book" | "donate" | "sponsor" | "volunteer";
export type ParticipationStatus = "active" | "cancelled" | "attended" | "no_show";
export type ParticipationMode = "single" | "multiple";
export type BeneficiaryRelation = "self" | "family" | "other";

export interface ParticipationBeneficiary {
  id?: string;
  relation_type: BeneficiaryRelation;
  full_name: string;
  membership_id?: string | null;
}

export interface Participation {
  id: string;
  organization_id: number;
  event_id: string;
  event_component_id?: string | null;
  membership_id: string;
  type: ParticipationType;
  status: ParticipationStatus;
  registration_method: "join" | "participate" | "book";
  mode: ParticipationMode;
  party_size: number;
  qr_code_token: string;
  attended_at?: string | null;
  createdAt: string;
  beneficiaries?: ParticipationBeneficiary[];
}

/** One beneficiary in the create request. Provide either `membership_id`
 * (to look an existing member up and auto-fill their name) or `full_name`
 * (for a family member/guest who isn't a member) — never both is required,
 * but at least one is. `full_name`/`membership_id` are both ignored for
 * relation_type "self": the server always fills the caller's own name in. */
export interface BeneficiaryInput {
  relation_type: BeneficiaryRelation;
  full_name?: string;
  membership_id?: string;
}

export interface CreateParticipationInput {
  event_id: string;
  event_component_id?: string;
  type: "join" | "book";
  registration_method?: "join" | "participate";
  seats_requested?: number;
  mode?: ParticipationMode;
  beneficiaries?: BeneficiaryInput[];
}


export interface UpdateParticipationInput {
  mode?: ParticipationMode;
  beneficiaries?: BeneficiaryInput[];
}

export interface Availability {
  capacity: number | null;
  used: number;
  available: number | null;
}

export interface ComponentReportEntry {
  participation_id: string;
  membership_id: string;
  type: ParticipationType;
  registration_method: "join" | "participate" | "book";
  mode: ParticipationMode;
  status: ParticipationStatus;
  party_size: number;
  created_at: string;
  beneficiaries: ParticipationBeneficiary[];
}

export interface ComponentReport {
  component_id: string;
  total_registrations: number;
  total_people: number;
  registrations: ComponentReportEntry[];
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const createParticipation = (data: CreateParticipationInput) =>
  apiRequest("POST", "/community/participations", data).then((r) => json<Participation>(r));

export const getMyParticipations = (type?: string, registrationMethod?: "join" | "participate" | "book") => {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (registrationMethod) params.set("registration_method", registrationMethod);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest("GET", `/community/participations/me${query}`).then((r) => json<Participation[]>(r));
};

export const updateParticipation = (id: string, data: UpdateParticipationInput) =>
  apiRequest("PATCH", `/community/participations/${id}`, data).then((r) => json<Participation>(r));

export const cancelParticipation = (id: string) =>
  apiRequest("POST", `/community/participations/${id}/cancel`).then((r) => json<Participation>(r));

export const getComponentAvailability = (componentId: string) =>
  apiRequest("GET", `/community/components/${componentId}/availability`).then((r) => json<Availability>(r));

export const getComponentReport = (componentId: string) =>
  apiRequest("GET", `/community/components/${componentId}/report`).then((r) => json<ComponentReport>(r));

export const attendByQrToken = (qrCodeToken: string) =>
  apiRequest("POST", "/community/participations/attend", { qr_code_token: qrCodeToken }).then((r) => json<Participation>(r));
