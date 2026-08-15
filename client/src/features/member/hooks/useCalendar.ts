import { useQuery } from "@tanstack/react-query";
import { getCalendarEvents } from "../api/calendar";

export const useCalendarEvents = (from: string, to: string) =>
  useQuery({ queryKey: ["calendar-events", from, to], queryFn: () => getCalendarEvents(from, to) });
