import { apiRequest } from "@/lib/queryClient";

export type ChatVisibility = "internal_only" | "internal_and_external" | "admin_only";

export interface ChatMessage {
  id: string;
  organization_id: number;
  event_id: string;
  event_component_id?: string | null;
  membership_id: string;
  body: string;
  is_deleted: boolean;
  createdAt: string;
  sender_name?: string;
}

export interface ChatConfig {
  event_id: string;
  who_can_view: ChatVisibility;
  who_can_post: ChatVisibility;
  replies_allowed: boolean;
  moderation_required: boolean;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getChatHistory = (eventId: string) =>
  apiRequest("GET", `/community/events/${eventId}/chat/history`).then((r) => json<ChatMessage[]>(r));

export const getChatConfig = (eventId: string) =>
  apiRequest("GET", `/community/events/${eventId}/chat-config`).then((r) => json<ChatConfig>(r));

export const updateChatConfig = (eventId: string, data: Partial<Omit<ChatConfig, "event_id">>) =>
  apiRequest("PATCH", `/community/events/${eventId}/chat-config`, data).then((r) => json<ChatConfig>(r));
