"use client";

import { api } from "./client";
import type {
  CommunityEvent,
  ComponentAvailability,
  CreateDonationInput,
  CreateParticipationInput,
  DirectoryEntry,
  Donation,
  EventDay,
  EventStatus,
  EventType,
  JoinCommunityResult,
  Membership,
  MyDonation,
  MySponsorship,
  MyVolunteerAssignment,
  OtpRequestResult,
  OtpVerifyResult,
  Participation,
  ParticipationType,
  PublicOrganization,
  SponsorshipNeed,
  User,
  VolunteerAssignment,
  VolunteerRole,
} from "./types";

/*
 * Endpoint bindings. Paths are verified against the real controllers; the
 * gateway mounts auth-svc at /api/auth and community-svc at /api/community.
 */

export const authApi = {
  requestOtp: (phone: string) =>
    api.post<OtpRequestResult>(
      "/api/auth/otp/request",
      { phone },
      { anonymous: true },
    ),

  verifyOtp: (phone: string, code: string) =>
    api.post<OtpVerifyResult>(
      "/api/auth/otp/verify",
      { phone, code },
      { anonymous: true },
    ),

  /** The OTP token travels in the BODY, not an Authorization header. */
  joinCommunity: (input: {
    otpVerifiedToken: string;
    firstName: string;
    lastName?: string;
    unitIdentifier?: string;
    organizationId?: number;
    invitationCode?: string;
  }) =>
    api.post<JoinCommunityResult>("/api/auth/join-community", input, {
      anonymous: true,
    }),

  /** Authenticated. Returns every membership, including pending/rejected. */
  myMemberships: () =>
    api.get<{ memberships: Membership[] }>("/api/auth/me/memberships"),

  logout: () => api.post<{ message: string }>("/api/auth/logout"),

  /** Public branding/lookup, so the header is branded before sign-in. */
  organizationBySubdomain: (subdomain: string) =>
    api.get<PublicOrganization>(
      `/api/auth/organizations/by-subdomain/${encodeURIComponent(subdomain)}`,
      { anonymous: true },
    ),

  /**
   * Profile update.
   *
   * Only these five fields are ever sent. The endpoint's DTO also accepts
   * `role`, `roleId` and `isActive` and does NOT verify that the caller owns
   * the target id, so sending those from a resident UI would hand out a
   * privilege-escalation path. Deliberately not exposed.
   */
  updateProfile: (
    userId: string,
    input: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      dob?: string;
    },
  ) =>
    api.put<{ status: boolean; message: string }>(
      `/api/auth/user/${userId}`,
      input,
    ),
};

export const eventsApi = {
  /**
   * NOTE: this endpoint returns drafts too, so `status` is passed explicitly
   * rather than relying on the server to hide unpublished events.
   */
  list: (params?: { status?: EventStatus; event_type?: EventType }) =>
    api.get<CommunityEvent[]>("/api/community/events", { query: params }),

  /** Includes `days` and `days.components`. */
  byId: (id: string) => api.get<CommunityEvent>(`/api/community/events/${id}`),

  schedule: (id: string) =>
    api.get<EventDay[]>(`/api/community/events/${id}/schedule`),

  componentAvailability: (componentId: string) =>
    api.get<ComponentAvailability>(
      `/api/community/components/${componentId}/availability`,
    ),
};

export const participationsApi = {
  create: (input: CreateParticipationInput) =>
    api.post<Participation>("/api/community/participations", input),

  mine: (type?: ParticipationType) =>
    api.get<Participation[]>("/api/community/participations/me", {
      query: { type },
    }),

  cancel: (id: string) =>
    api.post<Participation>(`/api/community/participations/${id}/cancel`),
};

export const donationsApi = {
  /** `currency` and `payment_method` are not accepted here by design. */
  create: (input: CreateDonationInput) =>
    api.post<Donation>("/api/community/donations", input),

  mine: () => api.get<MyDonation[]>("/api/community/donations/me"),
};

export const sponsorshipsApi = {
  needsForEvent: (eventId: string) =>
    api.get<SponsorshipNeed[]>(
      `/api/community/events/${eventId}/sponsorship-needs`,
    ),

  mine: () => api.get<MySponsorship[]>("/api/community/sponsorships/me"),
};

export const volunteersApi = {
  rolesForEvent: (eventId: string) =>
    api.get<VolunteerRole[]>(`/api/community/events/${eventId}/volunteer-roles`),

  signUp: (volunteerRoleId: string) =>
    api.post<VolunteerAssignment>("/api/community/volunteer-assignments", {
      volunteer_role_id: volunteerRoleId,
    }),

  mine: () =>
    api.get<MyVolunteerAssignment[]>("/api/community/volunteer-assignments/me"),

  /**
   * Returns the assignment UNMODIFIED -- cancellation is recorded on the
   * hidden participation row, so callers must refetch rather than trust this.
   */
  cancel: (id: string) =>
    api.post<VolunteerAssignment>(
      `/api/community/volunteer-assignments/${id}/cancel`,
    ),
};

export const membersApi = {
  /** Active + directory_visible members only. Takes no query params. */
  list: () => api.get<DirectoryEntry[]>("/api/community/members"),
};
