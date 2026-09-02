import { apiRequest } from "@/lib/queryClient";

export type EventType =
  | "community_program"
  | "festival"
  | "educational_program"
  | "workshop"
  | "sports"
  | "cultural"
  | "meeting"
  | "fundraising";

export type EventAudience = "internal" | "internal_external" | "public" | "invite_only";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type ComponentType = "activity" | "seva" | "donation_drive" | "session" | "book";
export type LocationResource = "conference_room" | "lab" | "terrace" | "open_space" | "club";
export type DayRegistrationMode = "join" | "participate" | "both";

export interface EventComponent {
  id: string;
  event_day_id: string;
  organization_id: number;
  name: string;
  description?: string;
  component_type: ComponentType;
  start_time?: string;
  end_time?: string;
  requires_booking: boolean;
  location_resource?: LocationResource;
  capacity?: number;
  audience?: EventAudience;
  registration_enabled: boolean;
  participation_enabled: boolean;
  donation_enabled: boolean;
  sponsorship_enabled: boolean;
  volunteer_enabled: boolean;
  price_internal?: number;
  price_external?: number;
  status: string;
  sequence: number;
}

export interface EventDay {
  id: string;
  event_id: string;
  day_number: number;
  date: string;
  title: string;
  description?: string;
  sequence: number;
  audience?: EventAudience;
  registration_mode: DayRegistrationMode;
  components?: EventComponent[];
}

export interface CommunityEvent {
  id: string;
  organization_id: number;
  name: string;
  description?: string;
  event_type: EventType;
  is_multi_day: boolean;
  start_date: string;
  end_date: string;
  venue?: string;
  timezone: string;
  cover_image_url?: string;
  capacity?: number;
  audience: EventAudience;
  registration_required: boolean;
  booking_enabled: boolean;
  donation_enabled: boolean;
  volunteer_enabled: boolean;
  sponsorship_enabled: boolean;
  status: EventStatus;
  created_by_user_id: string;
  published_at?: string;
  days?: EventDay[];
}

export interface CreateEventInput {
  name: string;
  description?: string;
  event_type: EventType;
  is_multi_day?: boolean;
  start_date: string;
  end_date: string;
  venue?: string;
  timezone?: string;
  cover_image_url?: string;
  capacity?: number;
  audience?: EventAudience;
  registration_required?: boolean;
  booking_enabled?: boolean;
  donation_enabled?: boolean;
  volunteer_enabled?: boolean;
  sponsorship_enabled?: boolean;
}

export type UpdateEventInput = Partial<CreateEventInput>;

export interface CreateEventDayInput {
  day_number: number;
  date: string;
  title: string;
  description?: string;
  sequence?: number;
  audience?: EventAudience;
  registration_mode?: DayRegistrationMode;
}

export interface CreateEventComponentInput {
  name: string;
  description?: string;
  component_type?: ComponentType;
  start_time?: string;
  end_time?: string;
  requires_booking?: boolean;
  location_resource?: LocationResource;
  capacity?: number;
  audience?: EventAudience;
  registration_enabled?: boolean;
  participation_enabled?: boolean;
  donation_enabled?: boolean;
  sponsorship_enabled?: boolean;
  volunteer_enabled?: boolean;
  price_internal?: number;
  price_external?: number;
  sequence?: number;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getEvents = (params?: { status?: string; event_type?: string }) => {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.event_type) qs.set("event_type", params.event_type);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiRequest("GET", `/community/events${query}`).then((r) => json<CommunityEvent[]>(r));
};

export const getEvent = (id: string) =>
  apiRequest("GET", `/community/events/${id}`).then((r) => json<CommunityEvent>(r));

export const getEventSchedule = (id: string) =>
  apiRequest("GET", `/community/events/${id}/schedule`).then((r) => json<EventDay[]>(r));

export const createEvent = (data: CreateEventInput) =>
  apiRequest("POST", "/community/events", data).then((r) => json<CommunityEvent>(r));

export const updateEvent = (id: string, data: UpdateEventInput) =>
  apiRequest("PATCH", `/community/events/${id}`, data).then((r) => json<CommunityEvent>(r));

export const publishEvent = (id: string) =>
  apiRequest("POST", `/community/events/${id}/publish`).then((r) => json<CommunityEvent>(r));

export const cancelEvent = (id: string) =>
  apiRequest("DELETE", `/community/events/${id}`).then((r) => json<CommunityEvent>(r));

export const createEventDay = (eventId: string, data: CreateEventDayInput) =>
  apiRequest("POST", `/community/events/${eventId}/days`, data).then((r) => json<EventDay>(r));

export const updateEventDay = (dayId: string, data: Partial<CreateEventDayInput>) =>
  apiRequest("PATCH", `/community/days/${dayId}`, data).then((r) => json<EventDay>(r));

export const deleteEventDay = (dayId: string) => apiRequest("DELETE", `/community/days/${dayId}`);

export const createEventComponent = (dayId: string, data: CreateEventComponentInput) =>
  apiRequest("POST", `/community/days/${dayId}/components`, data).then((r) => json<EventComponent>(r));

export const updateEventComponent = (componentId: string, data: Partial<CreateEventComponentInput>) =>
  apiRequest("PATCH", `/community/components/${componentId}`, data).then((r) => json<EventComponent>(r));

export const deleteEventComponent = (componentId: string) =>
  apiRequest("DELETE", `/community/components/${componentId}`);

// Guest/public — no auth required
export const getPublicEvents = (subdomain: string) =>
  apiRequest("GET", `/community/public/events?subdomain=${encodeURIComponent(subdomain)}`).then((r) =>
    json<CommunityEvent[]>(r)
  );

export const getPublicEvent = (id: string) =>
  apiRequest("GET", `/community/public/events/${id}`).then((r) => json<CommunityEvent>(r));
