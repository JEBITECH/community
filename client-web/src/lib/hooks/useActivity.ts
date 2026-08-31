"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  donationsApi,
  membersApi,
  participationsApi,
  sponsorshipsApi,
  volunteersApi,
} from "@/lib/api/endpoints";
import { qk } from "./queryKeys";
import type {
  CreateParticipationInput,
  DirectoryEntry,
  Participation,
} from "@/lib/api/types";

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function useMyParticipations() {
  return useQuery({
    queryKey: qk.participations.mine,
    queryFn: () => participationsApi.mine(),
  });
}

export function useMyDonations() {
  return useQuery({
    queryKey: qk.donations.mine,
    queryFn: () => donationsApi.mine(),
  });
}

export function useMySponsorships() {
  return useQuery({
    queryKey: qk.sponsorships.mine,
    queryFn: () => sponsorshipsApi.mine(),
  });
}

export function useMyVolunteering() {
  return useQuery({
    queryKey: qk.volunteers.mine,
    queryFn: () => volunteersApi.mine(),
  });
}

/**
 * Member directory. The endpoint takes no query parameters and already
 * excludes members who opted out, so filtering happens client-side.
 */
export function useMembers() {
  return useQuery({
    queryKey: qk.members.list,
    queryFn: () => membersApi.list(),
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * RSVP ("join") or seat booking ("book").
 *
 * Not optimistic on purpose: the server enforces capacity under a row lock and
 * can legitimately reject with CAPACITY_EXCEEDED or ALREADY_REGISTERED, so
 * showing success before it confirms would have to be undone in front of the
 * user.
 */
export function useParticipate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateParticipationInput) =>
      participationsApi.create(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: qk.participations.all });
      if (input.event_component_id) {
        void queryClient.invalidateQueries({
          queryKey: qk.events.availability(input.event_component_id),
        });
      }
    },
  });
}

export function useCancelParticipation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => participationsApi.cancel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.participations.all });
      // Freeing a seat changes availability everywhere it's displayed.
      void queryClient.invalidateQueries({ queryKey: qk.events.all });
    },
  });
}

export function useVolunteerSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => volunteersApi.signUp(roleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.volunteers.all });
      void queryClient.invalidateQueries({ queryKey: qk.participations.all });
    },
  });
}

/**
 * Withdraws from a volunteer role.
 *
 * The API returns the assignment UNCHANGED (cancellation is recorded on the
 * hidden participation row), so the response is ignored and the lists are
 * refetched instead of being patched from it.
 */
export function useCancelVolunteering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => volunteersApi.cancel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.volunteers.all });
      void queryClient.invalidateQueries({ queryKey: qk.participations.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/**
 * Active participations keyed by what they're against.
 *
 * `GET /participations/me` carries no event or component names, so the UI
 * matches on ids to decide whether to show "Join" or "Joined".
 */
export function useMyParticipationIndex() {
  const { data } = useMyParticipations();

  return useMemo(() => {
    const byComponent = new Map<string, Participation>();
    const byEvent = new Map<string, Participation>();

    for (const p of data ?? []) {
      if (p.status !== "active") continue;
      if (p.event_component_id) byComponent.set(p.event_component_id, p);
      else byEvent.set(p.event_id, p);
    }

    return { byComponent, byEvent };
  }, [data]);
}

/** Volunteer role ids the member has signed up for (excluding rejections). */
export function useMyVolunteerRoleIds(): Set<string> {
  const { data } = useMyVolunteering();

  return useMemo(() => {
    const set = new Set<string>();
    for (const a of data ?? []) {
      if (a.approval_status !== "rejected") set.add(a.volunteer_role_id);
    }
    return set;
  }, [data]);
}

export function displayName(entry: DirectoryEntry): string {
  return (
    [entry.first_name, entry.last_name].filter(Boolean).join(" ").trim() ||
    "Member"
  );
}
