import { apiRequest } from "@/lib/queryClient";

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement {
  id: string;
  organization_id: number;
  membership_id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  is_deleted: boolean;
  published_at: string;
  expires_at?: string | null;
  createdAt: string;
  updatedAt: string;
}

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getAnnouncements = () => apiRequest("GET", "/community/announcements").then((r) => json<Announcement[]>(r));

export const createAnnouncement = (data: {
  title: string;
  body: string;
  priority?: AnnouncementPriority;
  is_pinned?: boolean;
  expires_at?: string;
}) => apiRequest("POST", "/community/announcements", data).then((r) => json<Announcement>(r));

export const updateAnnouncement = (
  id: string,
  data: Partial<{
    title: string;
    body: string;
    priority: AnnouncementPriority;
    is_pinned: boolean;
    expires_at: string | null;
  }>,
) => apiRequest("PATCH", `/community/announcements/${id}`, data).then((r) => json<Announcement>(r));

export const deleteAnnouncement = (id: string) => apiRequest("DELETE", `/community/announcements/${id}`).then((r) => json<Announcement>(r));
