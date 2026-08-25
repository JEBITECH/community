export enum Role {
  /** Platform-level administrator; not scoped to any single organization. */
  MASTER_ADMIN = 'master_admin',
  /** Organization administrator (per-org). */
  SUPER_ADMIN = 'super_admin',
  /** Organizing committee member (per-org). */
  CORE_COMMITTEE = 'core_committee',
  /** Belongs to the organization. */
  INTERNAL_MEMBER = 'internal_member',
  /** Does not belong to the organization; participates where permitted. */
  EXTERNAL_MEMBER = 'external_member',
}
