"use client";

import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { eventsApi, sponsorshipsApi, volunteersApi } from "@/lib/api/endpoints";
import { qk } from "./queryKeys";
import { daysFromToday, todayISO } from "@/lib/utils/format";
import type { CommunityEvent, EventComponent, EventDay } from "@/lib/api/types";

/**
 * Published events for the active organization.
 *
 * `status: "published"` is passed explicitly because GET /events returns
 * drafts too -- a resident would otherwise see events the committee is still
 * drafting.
 */
export function usePublishedEvents() {
  return useQuery({
    queryKey: qk.events.published,
    queryFn: () => eventsApi.list({ status: "published" }),
  });
}

/** Full detail including `days` and `days.components`. */
export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: qk.events.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: () => eventsApi.byId(id as string),
  });
}

export function useVolunteerRoles(eventId: string | undefined) {
  return useQuery({
    queryKey: qk.volunteers.roles(eventId ?? ""),
    enabled: Boolean(eventId),
    queryFn: () => volunteersApi.rolesForEvent(eventId as string),
  });
}

/**
 * Volunteer roles across several events at once.
 *
 * There's no org-wide "all volunteer roles" endpoint -- roles are only exposed
 * per event -- so this fans out one query per event and stitches the results
 * back together, keeping each event's roles individually cached.
 */
export function useVolunteerRolesForEvents(events: CommunityEvent[]) {
  const results = useQueries({
    queries: events.map((event) => ({
      queryKey: qk.volunteers.roles(event.id),
      queryFn: () => volunteersApi.rolesForEvent(event.id),
    })),
  });

  const groups = useMemo(
    () =>
      events
        .map((event, i) => ({
          event,
          roles: (results[i]?.data ?? []).filter((r) => r.status !== "closed"),
        }))
        .filter((g) => g.roles.length > 0),
    // `results` is a new array each render; its data identity is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [events, results.map((r) => r.dataUpdatedAt).join(",")],
  );

  return {
    groups,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}

export function useSponsorshipNeeds(eventId: string | undefined) {
  return useQuery({
    queryKey: qk.sponsorships.needs(eventId ?? ""),
    enabled: Boolean(eventId),
    queryFn: () => sponsorshipsApi.needsForEvent(eventId as string),
  });
}

export function useComponentAvailability(
  componentId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: qk.events.availability(componentId ?? ""),
    enabled: Boolean(componentId) && enabled,
    queryFn: () => eventsApi.componentAvailability(componentId as string),
    // Capacity moves as others book, so keep it fresher than the default.
    staleTime: 10_000,
  });
}

// ---------------------------------------------------------------------------
// Derivations
// ---------------------------------------------------------------------------

export interface EventBuckets {
  live: CommunityEvent[];
  upcoming: CommunityEvent[];
  past: CommunityEvent[];
}

/** Splits events into on-now / upcoming / finished. */
export function categorize(events: CommunityEvent[]): EventBuckets {
  const today = todayISO();
  const live: CommunityEvent[] = [];
  const upcoming: CommunityEvent[] = [];
  const past: CommunityEvent[] = [];

  for (const e of events) {
    if (e.start_date <= today && e.end_date >= today) live.push(e);
    else if (e.start_date > today) upcoming.push(e);
    else past.push(e);
  }

  live.sort((a, b) => a.start_date.localeCompare(b.start_date));
  upcoming.sort((a, b) => a.start_date.localeCompare(b.start_date));
  past.sort((a, b) => b.end_date.localeCompare(a.end_date));

  return { live, upcoming, past };
}

/**
 * The event the banner is about: on now, or starting within `withinDays`.
 * Returns null when nothing qualifies, which is what hides the banner.
 */
export function useFeaturedEvent(withinDays = 7) {
  const query = usePublishedEvents();

  const featured = useMemo(() => {
    const { live, upcoming } = categorize(query.data ?? []);
    if (live.length > 0) return live[0];

    const soon = upcoming.find(
      (e) => daysFromToday(e.start_date) <= withinDays,
    );
    return soon ?? null;
  }, [query.data, withinDays]);

  return { ...query, event: featured };
}

/** All components across an event's days, flattened in schedule order. */
export function flattenComponents(days: EventDay[] | undefined): EventComponent[] {
  if (!days?.length) return [];

  return [...days]
    .sort((a, b) => a.day_number - b.day_number)
    .flatMap((day) =>
      [...(day.components ?? [])].sort((a, b) => a.sequence - b.sequence),
    );
}

/** The day entry matching today, used for "today's schedule". */
export function findTodayDay(days: EventDay[] | undefined): EventDay | null {
  if (!days?.length) return null;
  const today = todayISO();
  return days.find((d) => d.date === today) ?? null;
}
