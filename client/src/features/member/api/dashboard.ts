import { apiRequest } from "@/lib/queryClient";

export interface OrgSummary {
  members: { active: number; pending: number; internal: number; external: number };
  events: { draft: number; published: number; cancelled: number; completed: number; upcoming: number };
  donations: { count: number; total_recorded: number; total_pending: number };
  sponsorships: { count: number; total_recorded: number; total_pledged: number };
  volunteers: { roles_open: number; roles_filled: number; assignments_pending: number; assignments_approved: number };
}

export interface EventSummary {
  event: { id: string; name: string; status: string };
  participations: { join_active: number; book_active: number; seats_booked: number };
  donations: { count: number; total_recorded: number };
  sponsorships: { count: number; total_recorded: number; needs_open: number; needs_fulfilled: number };
  volunteers: { roles: number; assignments_approved: number; assignments_pending: number };
}

export interface PlatformSummary {
  organizations: { total: number; active: number; suspended: number };
  members_total: number;
  events: { total: number; published: number };
  donations_total_recorded: number;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getOrgSummary = () => apiRequest("GET", "/community/dashboard/org-summary").then((r) => json<OrgSummary>(r));

export const getEventSummary = (eventId: string) =>
  apiRequest("GET", `/community/dashboard/events/${eventId}`).then((r) => json<EventSummary>(r));

export const getPlatformSummary = () => apiRequest("GET", "/community/dashboard/platform-summary").then((r) => json<PlatformSummary>(r));
