// Shared domain types for the community website.
// These mirror the shapes the community-svc API is expected to return,
// so swapping mock data for real fetches later is a drop-in change.

export type Icon = string; // Tabler icon name, e.g. "ti-calendar-event"

export type ActionKind =
  | "join"
  | "joined"
  | "volunteer"
  | "book"
  | "participant"
  | "ghost";

export interface TimelineActivity {
  id: string;
  time: string;
  title: string;
  meta: string;
  metaIcon: Icon;
  metaIconColor?: string;
  /** Colour of the timeline dot */
  dotColor?: string;
  action: {
    kind: ActionKind;
    label: string;
    /** modal to open when clicked, if any */
    modal?: ModalKind;
  };
}

export type EventStatus =
  | "ongoing"
  | "coming-soon"
  | "registration-open"
  | "urgent";

export interface EventItem {
  id: string;
  emoji: string;
  title: string;
  status: EventStatus;
  meta: { icon: Icon; label: string }[];
  actions: {
    kind: ActionKind;
    label: string;
    icon?: Icon;
    modal?: ModalKind;
  }[];
}

export interface VolunteerOpp {
  id: string;
  icon: Icon;
  iconTint: "saffron" | "teal" | "gold";
  title: string;
  date: string;
  spots: string;
  progress: number; // 0-100
}

export type AnnouncementTone = "saf" | "tel" | "grn" | "red" | "gold";

export interface Announcement {
  id: string;
  tone: AnnouncementTone;
  badge: string;
  icon: Icon;
  title: string;
  body: string;
  meta: string;
}

export interface ScheduleGroup {
  label: string;
  items: ScheduleItem[];
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  event: string;
  ref?: string;
  status: {
    kind: "joined" | "volunteer" | "participant" | "book";
    label: string;
    icon: Icon;
  };
}

export interface Discussion {
  id: string;
  initials: string;
  avatarGradient: string;
  name: string;
  when: string;
  tagLabel: string;
  tagKind: "done" | "part" | "book";
  title: string;
  preview: string;
  likes: string;
  comments: string;
  follow?: boolean;
}

export interface Birthday {
  id: string;
  initials: string;
  avatarGradient: string;
  name: string;
  detail: string;
  today: boolean;
}

export interface FeedItem {
  id: string;
  dotColor: string;
  text: string;
  time: string;
}

export interface Person {
  id: string;
  initials: string;
  avatarGradient: string;
  name: string;
  role: string;
}

export type ModalKind = "join" | "vol" | "book" | "wish" | "success";
