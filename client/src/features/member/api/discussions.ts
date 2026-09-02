import { apiRequest } from "@/lib/queryClient";

export interface DiscussionTopic {
  id: string;
  organization_id: number;
  event_id: string;
  membership_id: string;
  heading: string;
  body?: string | null;
  is_pinned: boolean;
  is_closed: boolean;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
  author_name: string;
  comment_count: number;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getEventDiscussions = (eventId: string) =>
  apiRequest("GET", `/community/events/${eventId}/discussions`).then((r) => json<DiscussionTopic[]>(r));

export const createDiscussionTopic = (
  eventId: string,
  data: { heading: string; body?: string },
) =>
  apiRequest("POST", `/community/events/${eventId}/discussions`, data).then((r) => json<DiscussionTopic>(r));

export const updateDiscussionTopic = (
  id: string,
  data: { heading?: string; body?: string | null },
) =>
  apiRequest("PATCH", `/community/discussions/${id}`, data).then((r) => json<DiscussionTopic>(r));

export const moderateDiscussionTopic = (
  id: string,
  data: { is_pinned?: boolean; is_closed?: boolean },
) =>
  apiRequest("PATCH", `/community/discussions/${id}/moderate`, data).then((r) => json<DiscussionTopic>(r));

export const deleteDiscussionTopic = (id: string) =>
  apiRequest("DELETE", `/community/discussions/${id}`).then((r) => json<DiscussionTopic>(r));
