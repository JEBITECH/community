import { useQuery } from "@tanstack/react-query";
import { getOrgSummary, getEventSummary, getPlatformSummary } from "../api/dashboard";

export const useOrgSummary = () => useQuery({ queryKey: ["org-summary"], queryFn: getOrgSummary });

export const useEventSummary = (eventId?: string) =>
  useQuery({ queryKey: ["event-summary", eventId], queryFn: () => getEventSummary(eventId!), enabled: !!eventId });

export const usePlatformSummary = () => useQuery({ queryKey: ["platform-summary"], queryFn: getPlatformSummary });
