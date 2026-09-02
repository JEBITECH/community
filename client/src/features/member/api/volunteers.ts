import { apiRequest } from "@/lib/queryClient";

export type VolunteerRoleStatus = "open" | "filled" | "closed";
export type VolunteerApprovalStatus = "pending" | "approved" | "rejected";
export type VolunteerRoleKind = "volunteer" | "book";

export interface VolunteerRole {
  id: string;
  organization_id: number;
  event_id: string;
  event_component_id?: string | null;
  title: string;
  description?: string;
  slot_start?: string;
  slot_end?: string;
  headcount_needed: number;
  headcount_filled: number;
  kind: VolunteerRoleKind;
  status: VolunteerRoleStatus;
  createdAt: string;
}

export interface VolunteerAssignment {
  id: string;
  participation_id: string;
  volunteer_role_id: string;
  membership_id: string;
  approval_status: VolunteerApprovalStatus;
  approved_by_user_id?: string | null;
  approved_at?: string | null;
  attendance_marked: boolean;
  createdAt: string;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getEventVolunteerRoles = (eventId: string) =>
  apiRequest("GET", `/community/events/${eventId}/volunteer-roles`).then((r) => json<VolunteerRole[]>(r));

export const createVolunteerRole = (data: {
  event_id: string;
  event_component_id?: string;
  title: string;
  description?: string;
  slot_start?: string;
  slot_end?: string;
  headcount_needed: number;
  kind?: VolunteerRoleKind;
}) => apiRequest("POST", "/community/volunteer-roles", data).then((r) => json<VolunteerRole>(r));

export const getRoleAssignments = (roleId: string) =>
  apiRequest("GET", `/community/volunteer-roles/${roleId}/assignments`).then((r) => json<VolunteerAssignment[]>(r));

export const createVolunteerAssignment = (volunteer_role_id: string) =>
  apiRequest("POST", "/community/volunteer-assignments", { volunteer_role_id }).then((r) => json<VolunteerAssignment>(r));

export const getMyVolunteerAssignments = () =>
  apiRequest("GET", "/community/volunteer-assignments/me").then((r) =>
    json<(VolunteerAssignment & { event_id: string; event_name: string; role_title: string })[]>(r)
  );

export const cancelVolunteerAssignment = (id: string) =>
  apiRequest("POST", `/community/volunteer-assignments/${id}/cancel`).then((r) => json<VolunteerAssignment>(r));

export const approveVolunteerAssignment = (id: string) =>
  apiRequest("PATCH", `/community/volunteer-assignments/${id}/approve`).then((r) => json<VolunteerAssignment>(r));

export const rejectVolunteerAssignment = (id: string) =>
  apiRequest("PATCH", `/community/volunteer-assignments/${id}/reject`).then((r) => json<VolunteerAssignment>(r));

export const reassignVolunteerAssignment = (id: string, volunteer_role_id: string) =>
  apiRequest("PATCH", `/community/volunteer-assignments/${id}/reassign`, { volunteer_role_id }).then((r) => json<VolunteerAssignment>(r));
