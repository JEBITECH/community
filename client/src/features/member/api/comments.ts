import { apiRequest } from "@/lib/queryClient";

export type CommentModerationStatus = "visible" | "hidden" | "reported";

export interface EventComment {
  id: string;
  organization_id: number;
  event_id: string;
  event_component_id?: string | null;
  discussion_topic_id?: string | null;
  membership_id: string;
  parent_comment_id?: string | null;
  body: string;
  is_deleted: boolean;
  is_pinned: boolean;
  moderation_status: CommentModerationStatus;
  createdAt: string;
  updatedAt: string;
  author_name: string;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getMyComments = () =>
  apiRequest("GET", "/community/comments/me").then((r) =>
    json<(EventComment & { event_id: string; event_name: string })[]>(r),
  );

export const getEventComments = (
  eventId: string,
  opts?: { eventComponentId?: string; discussionTopicId?: string },
) => {
  const params = new URLSearchParams();

  if (opts?.eventComponentId) {
    params.set("event_component_id", opts.eventComponentId);
  }
  if (opts?.discussionTopicId) {
    params.set("discussion_topic_id", opts.discussionTopicId);
  }

  const query = params.toString();

  return apiRequest(
    "GET",
    `/community/events/${eventId}/comments${query ? `?${query}` : ""}`,
  ).then((r) => json<EventComment[]>(r));
};

export const createComment = (
  eventId: string,
  data: {
    body: string;
    event_component_id?: string;
    discussion_topic_id?: string;
    parent_comment_id?: string;
  },
) => apiRequest("POST", `/community/events/${eventId}/comments`, data).then((r) => json<EventComment>(r));

export const updateComment = (id: string, body: string) =>
  apiRequest("PATCH", `/community/comments/${id}`, { body }).then((r) => json<EventComment>(r));

export const deleteComment = (id: string) =>
  apiRequest("DELETE", `/community/comments/${id}`).then((r) => json<EventComment>(r));

export const reportComment = (id: string) =>
  apiRequest("POST", `/community/comments/${id}/report`).then((r) => json<EventComment>(r));

export const moderateComment = (id: string, moderation_status: "visible" | "hidden") =>
  apiRequest("PATCH", `/community/comments/${id}/moderate`, { moderation_status }).then((r) => json<EventComment>(r));
