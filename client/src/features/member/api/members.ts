import { apiRequest } from "@/lib/queryClient";

export interface DirectoryEntry {
  membership_id: string;
  first_name: string;
  last_name?: string;
  unit_identifier?: string;
  role: string;
  member_type: string;
  status: string;
  joined_at?: string;
  phone?: string;
  email?: string | null;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getDirectory = () => apiRequest("GET", "/community/members").then((r) => json<DirectoryEntry[]>(r));

export const getPendingMembers = () => apiRequest("GET", "/community/members/pending").then((r) => json<DirectoryEntry[]>(r));

export const getMember = (membershipId: string) => apiRequest("GET", `/community/members/${membershipId}`).then((r) => json<DirectoryEntry>(r));

export const approveMember = (membershipId: string) =>
  apiRequest("PATCH", `/community/members/${membershipId}/approve`).then((r) => json<DirectoryEntry>(r));

export const rejectMember = (membershipId: string) =>
  apiRequest("PATCH", `/community/members/${membershipId}/reject`).then((r) => json<DirectoryEntry>(r));
