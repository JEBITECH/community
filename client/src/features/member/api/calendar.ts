import { apiRequest } from "@/lib/queryClient";
import { CommunityEvent } from "./events";

async function json<T>(res: Response): Promise<T> {
  return res.json();
}

export const getCalendarEvents = (from: string, to: string) =>
  apiRequest("GET", `/community/calendar?from=${from}&to=${to}`).then((r) => json<CommunityEvent[]>(r));
