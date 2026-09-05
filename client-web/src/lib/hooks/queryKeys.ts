/**
 * Centralised query keys.
 *
 * Grouped by domain so a write can invalidate a whole branch (e.g. any
 * participation change refreshes every "my activity" list at once).
 */
export const qk = {
  events: {
    all: ["events"] as const,
    published: ["events", "published"] as const,
    detail: (id: string) => ["events", "detail", id] as const,
    availability: (componentId: string) =>
      ["events", "availability", componentId] as const,
  },
  volunteers: {
    all: ["volunteers"] as const,
    roles: (eventId: string) => ["volunteers", "roles", eventId] as const,
    mine: ["volunteers", "mine"] as const,
  },
  sponsorships: {
    all: ["sponsorships"] as const,
    needs: (eventId: string) => ["sponsorships", "needs", eventId] as const,
    mine: ["sponsorships", "mine"] as const,
  },
  participations: {
    all: ["participations"] as const,
    mine: ["participations", "mine"] as const,
  },
  donations: {
    all: ["donations"] as const,
    mine: ["donations", "mine"] as const,
  },
  members: {
    all: ["members"] as const,
    list: ["members", "list"] as const,
  },
  announcements: {
    all: ["announcements"] as const,
    list: ["announcements", "list"] as const,
  },
} as const;
