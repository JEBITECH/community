/**
 * Types mirroring the ACTUAL backend contracts, verified against the
 * controllers/DTOs/entities in server/services/*.
 *
 * Two conventions inherited from the backend that are easy to get wrong:
 *
 * 1. No response envelope. community-svc returns entities and arrays bare --
 *    there is no `{ data: ... }` wrapper anywhere.
 * 2. TypeORM `decimal` columns deserialize to STRINGS over JSON (e.g.
 *    "500.00"), even though the entity declares `number`. Those fields are
 *    typed `Decimal` here and must go through `toNumber()` before arithmetic.
 */

/** A TypeORM decimal column: a number in the entity, a string on the wire. */
export type Decimal = string | number;

/** `date` column -> "YYYY-MM-DD". */
export type DateOnly = string;
/** `time` column -> "HH:MM:SS". */
export type TimeOnly = string;
/** `timestamptz` column -> ISO 8601. */
export type Timestamp = string;

// ---------------------------------------------------------------------------
// Roles & identity
// ---------------------------------------------------------------------------

export type Role =
  | "master_admin"
  | "super_admin"
  | "core_committee"
  | "internal_member"
  | "external_member";

/** Roles that manage an organization; they see organizer affordances. */
export const ORGANIZER_ROLES: readonly Role[] = [
  "master_admin",
  "super_admin",
  "core_committee",
];

export type MemberType = "internal" | "external";
export type MembershipStatus = "pending" | "active" | "suspended" | "rejected";
export type MembershipModel = "open" | "approval_required" | "invite_only";

/** `User.toJSON()` strips password/refreshToken/verification+reset tokens. */
export interface User {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_verified: boolean;
  dob?: string | null;
  role: string;
  roleId?: number | null;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ThemeConfig {
  id: number;
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

export interface Organization {
  id: number;
  uuid: string;
  organization_name: string;
  organization_email: string;
  organization_location: string;
  organization_timezone: string;
  organization_type: "society" | "educational_institution";
  subdomain: string;
  membership_model: MembershipModel;
  organization_status: "pending" | "active" | "suspended";
  /** Nullable in practice despite the column default. */
  organization_logo: string | null;
  is_archived: boolean;
  themeConfig?: ThemeConfig | null;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: number;
  role: string;
  roleId?: number | null;
  member_type: MemberType;
  unit_identifier?: string | null;
  status: MembershipStatus;
  directory_visible: boolean;
  joined_at?: Timestamp | null;
  is_default: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Loaded by GET /me/memberships, absent on switch-org / join-community. */
  organization?: Organization;
}

/**
 * Public org lookup. NOTE: this endpoint returns its own flat projection --
 * `organization_id` rather than `id`, and only these seven keys.
 */
export interface PublicOrganization {
  organization_id: number;
  organization_name: string;
  organization_type: "society" | "educational_institution";
  organization_logo: string | null;
  membership_model: MembershipModel;
  subdomain: string;
  themeConfig?: ThemeConfig | null;
}

// ---------------------------------------------------------------------------
// Auth responses
// ---------------------------------------------------------------------------

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  /** Absent on POST /login (the controller omits it); present elsewhere. */
  membership?: Membership | null;
}

export interface OtpRequestResult {
  message: string;
  /** Only in non-production: auth-svc echoes the code back for dev. */
  debug_otp?: string;
}

export type OtpVerifyResult =
  | { isNewUser: true; otpVerifiedToken: string }
  | ({ isNewUser: false; message: string } & AuthSession);

export type JoinCommunityResult =
  | { status: "pending"; message: string; membership: Membership }
  | ({ status: "active"; message: string; membership: Membership } & AuthSession);

/** Decoded access-token claims (display/UX only -- never trusted for authz). */
export interface AccessTokenClaims {
  userId: string;
  email: string;
  role: string;
  organizationId: number | null;
  membershipId: string | null;
  exp: number;
  iat: number;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type EventType =
  | "community_program"
  | "festival"
  | "educational_program"
  | "workshop"
  | "sports"
  | "cultural"
  | "meeting"
  | "fundraising";

export type EventAudience =
  | "internal"
  | "internal_external"
  | "public"
  | "invite_only";

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export type ComponentType = "activity" | "seva" | "donation_drive" | "session";

export type LocationResource =
  | "conference_room"
  | "lab"
  | "terrace"
  | "open_space"
  | "club";

export interface EventComponent {
  id: string;
  event_day_id: string;
  organization_id: number;
  name: string;
  description?: string | null;
  component_type: ComponentType;
  start_time?: TimeOnly | null;
  end_time?: TimeOnly | null;
  requires_booking: boolean;
  location_resource?: LocationResource | null;
  capacity?: number | null;
  /** Overrides the day's, which overrides the event's. */
  audience?: EventAudience | null;
  registration_enabled: boolean;
  /** Distinct from `registration_enabled` (plain one-tap "Join"): this offers
   * the detailed Participate flow (single/multiple, self/family/other). */
  participation_enabled: boolean;
  donation_enabled: boolean;
  sponsorship_enabled: boolean;
  volunteer_enabled: boolean;
  price_internal?: Decimal | null;
  price_external?: Decimal | null;
  status: "draft" | "published" | "cancelled" | "completed";
  sequence: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EventDay {
  id: string;
  event_id: string;
  day_number: number;
  date: DateOnly;
  title: string;
  description?: string | null;
  sequence: number;
  audience?: EventAudience | null;
  /** Loaded by GET /events/:id and GET /events/:id/schedule. */
  components?: EventComponent[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommunityEvent {
  id: string;
  organization_id: number;
  name: string;
  description?: string | null;
  event_type: EventType;
  is_multi_day: boolean;
  start_date: DateOnly;
  end_date: DateOnly;
  venue?: string | null;
  cover_image_url?: string | null;
  capacity?: number | null;
  audience: EventAudience;
  registration_required: boolean;
  booking_enabled: boolean;
  donation_enabled: boolean;
  volunteer_enabled: boolean;
  sponsorship_enabled: boolean;
  status: EventStatus;
  created_by_user_id: string;
  published_at?: Timestamp | null;
  /** Only on detail reads, never on the list endpoint. */
  days?: EventDay[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ComponentAvailability {
  capacity: number | null;
  used: number;
  /** null when the component has no capacity limit. */
  available: number | null;
}

// ---------------------------------------------------------------------------
// Participation
// ---------------------------------------------------------------------------

/** The full column domain. Only `join` and `book` are POST-able by a member. */
export type ParticipationType =
  | "join"
  | "book"
  | "donate"
  | "sponsor"
  | "volunteer";

export type ParticipationStatus = "active" | "cancelled" | "attended" | "no_show";

export type BeneficiaryRelation = "self" | "family" | "other";
export type ParticipationMode = "single" | "multiple";

export interface ParticipationBeneficiary {
  id?: string;
  relation_type: BeneficiaryRelation;
  full_name: string;
  membership_id?: string | null;
}

export interface Participation {
  id: string;
  organization_id: number;
  event_id: string;
  event_component_id?: string | null;
  membership_id: string;
  type: ParticipationType;
  status: ParticipationStatus;
  registration_method: "join" | "participate" | "book";
  mode: ParticipationMode;
  party_size: number;
  /** Presented as the member's check-in QR payload. */
  qr_code_token: string;
  attended_at?: Timestamp | null;
  createdAt: Timestamp;
  /** Only populated for `registration_method: "participate"`. */
  beneficiaries?: ParticipationBeneficiary[];
}

/** One beneficiary in a create/update request. Provide either
 * `membership_id` (looked up server-side to auto-fill their name) or
 * `full_name` (for a family member/guest who isn't a member) -- both are
 * ignored for relation_type "self", which the server always resolves to the
 * caller's own membership. */
export interface BeneficiaryInput {
  relation_type: BeneficiaryRelation;
  full_name?: string;
  membership_id?: string;
}

export interface CreateParticipationInput {
  event_id: string;
  event_component_id?: string;
  /** POST /participations only accepts these two. */
  type: "join" | "book";
  /** Only meaningful for type "join": distinguishes a plain RSVP from the
   * detailed Participate flow. */
  registration_method?: "join" | "participate";
  /** Honoured for `book` only; the service ignores it for `join`. */
  seats_requested?: number;
  mode?: ParticipationMode;
  beneficiaries?: BeneficiaryInput[];
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export type PaymentStatus = "pending" | "recorded" | "failed";
export type DonationPurpose = "event" | "component" | "general";

export interface Donation {
  id: string;
  participation_id: string;
  amount: Decimal;
  currency: string;
  purpose: DonationPurpose;
  payment_status: PaymentStatus;
  receipt_number?: string | null;
  createdAt: Timestamp;
}

/** GET /donations/me joins the event name on. */
export type MyDonation = Donation & { event_id: string; event_name: string };

export interface CreateDonationInput {
  event_id: string;
  event_component_id?: string;
  amount: number;
  purpose?: DonationPurpose;
}

export interface SponsorshipNeed {
  id: string;
  organization_id: number;
  event_id: string;
  event_component_id?: string | null;
  title: string;
  description?: string | null;
  target_amount: Decimal;
  amount_raised: Decimal;
  status: "open" | "fulfilled" | "closed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Sponsorship {
  id: string;
  participation_id: string;
  sponsorship_need_id: string;
  amount_pledged: Decimal;
  payment_status: PaymentStatus;
  receipt_number?: string | null;
  createdAt: Timestamp;
}

export type MySponsorship = Sponsorship & {
  event_id: string;
  event_name: string;
};

// ---------------------------------------------------------------------------
// Volunteering
// ---------------------------------------------------------------------------

export interface VolunteerRole {
  id: string;
  organization_id: number;
  event_id: string;
  event_component_id?: string | null;
  title: string;
  description?: string | null;
  slot_start?: TimeOnly | null;
  slot_end?: TimeOnly | null;
  /** Note the naming: headcount_*, not slots/capacity. */
  headcount_needed: number;
  headcount_filled: number;
  status: "open" | "filled" | "closed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type VolunteerApprovalStatus = "pending" | "approved" | "rejected";

export interface VolunteerAssignment {
  id: string;
  participation_id: string;
  volunteer_role_id: string;
  membership_id: string;
  approval_status: VolunteerApprovalStatus;
  attendance_marked: boolean;
  createdAt: Timestamp;
}

export type MyVolunteerAssignment = VolunteerAssignment & {
  event_id: string;
  event_name: string;
  role_title: string;
};

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export type AnnouncementPriority = "normal" | "important" | "urgent";

/**
 * GET /announcements returns the entity rows. The list endpoint already hides
 * deleted/unpublished/expired rows, so the client can render whatever it gets.
 */
export interface Announcement {
  id: string;
  organization_id: number;
  membership_id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  published_at: Timestamp;
  expires_at?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Directory
// ---------------------------------------------------------------------------

/** GET /members returns this projection, not the Membership entity. */
export interface DirectoryEntry {
  membership_id: string;
  first_name: string;
  last_name?: string | null;
  unit_identifier?: string | null;
  role: string;
  member_type: string;
  status: string;
  joined_at?: Timestamp | null;
  /** Only present for admin-or-self on GET /members/:id. */
  phone?: string | null;
  email?: string | null;
}
