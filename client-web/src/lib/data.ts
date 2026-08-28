// Mock data for the community website, ported from the prototype.
// Replace these constants with API calls to community-svc when the
// endpoints are ready — the component layer only depends on these shapes.

import type {
  Announcement,
  Birthday,
  Discussion,
  EventItem,
  FeedItem,
  Person,
  ScheduleGroup,
  TimelineActivity,
  VolunteerOpp,
} from "./types";

export const HERO_STATS = [
  { num: "126", lbl: "Members", sub: "75 families" },
  { num: "8", lbl: "Upcoming events", sub: "Next: 20 Sep" },
  { num: "24", lbl: "Volunteers active", sub: "This festival" },
  { num: "₹42K", lbl: "Sponsorships", sub: "Raised so far" },
];

export const TODAY_TIMELINE: TimelineActivity[] = [
  {
    id: "t1",
    time: "10:00 AM",
    title: "Ganesh arrival",
    meta: "Main gate · Everyone welcome",
    metaIcon: "ti-map-pin",
    action: { kind: "joined", label: "Joined" },
  },
  {
    id: "t2",
    time: "12:00 PM",
    title: "Ganesh sthapana puja",
    meta: "Mandap · Priest: Pandit Ramesh",
    metaIcon: "ti-map-pin",
    action: { kind: "join", label: "Participate", modal: "join" },
  },
  {
    id: "t3",
    time: "7:30 PM",
    title: "Evening aarti",
    meta: "Mandap · 83 joining",
    metaIcon: "ti-map-pin",
    action: { kind: "joined", label: "Joined" },
  },
  {
    id: "t4",
    time: "8:30 PM",
    title: "Prasad distribution",
    meta: "4 volunteer spots remaining",
    metaIcon: "ti-heart-handshake",
    action: { kind: "volunteer", label: "Volunteer", modal: "vol" },
  },
  {
    id: "t5",
    time: "9:00 PM",
    title: "Community dinner",
    meta: "₹250/person · 35 seats left",
    metaIcon: "ti-currency-rupee",
    metaIconColor: "var(--color-gold)",
    dotColor: "var(--color-gold)",
    action: { kind: "book", label: "Book now", modal: "book" },
  },
];

export const EVENTS: EventItem[] = [
  {
    id: "e1",
    emoji: "🐘",
    title: "Ganesh Festival 2026",
    status: "ongoing",
    meta: [
      { icon: "ti-calendar", label: "20–25 Sep · 6 days" },
      { icon: "ti-map-pin", label: "Clubhouse & Garden" },
      { icon: "ti-users", label: "126 joined" },
    ],
    actions: [
      { kind: "joined", label: "Joined", icon: "ti-check" },
      { kind: "volunteer", label: "Volunteer", icon: "ti-heart-handshake", modal: "vol" },
      { kind: "ghost", label: "View schedule" },
    ],
  },
  {
    id: "e2",
    emoji: "💃",
    title: "Navratri celebration",
    status: "coming-soon",
    meta: [{ icon: "ti-calendar", label: "1–9 Oct · 9 nights" }],
    actions: [{ kind: "ghost", label: "Notify me", icon: "ti-bell" }],
  },
  {
    id: "e3",
    emoji: "🏆",
    title: "Sports Day 2026",
    status: "registration-open",
    meta: [
      { icon: "ti-calendar", label: "18 Oct" },
      { icon: "ti-list", label: "12 activities" },
      { icon: "ti-users", label: "34 registered" },
    ],
    actions: [
      { kind: "join", label: "Register", modal: "join" },
      { kind: "ghost", label: "Details" },
    ],
  },
  {
    id: "e4",
    emoji: "🩸",
    title: "Blood donation camp",
    status: "urgent",
    meta: [
      { icon: "ti-calendar", label: "25 Oct · 10 AM–4 PM" },
      { icon: "ti-users", label: "18 donors" },
    ],
    actions: [{ kind: "join", label: "Register to donate", modal: "join" }],
  },
];

export const VOLUNTEER_OPPS: VolunteerOpp[] = [
  {
    id: "v1",
    icon: "ti-sparkles",
    iconTint: "saffron",
    title: "Decoration team — Ganesh Festival",
    date: "19 Sep · 5:00 PM",
    spots: "4 spots left",
    progress: 60,
  },
  {
    id: "v2",
    icon: "ti-bowl",
    iconTint: "teal",
    title: "Food distribution — Prasad seva",
    date: "20 Sep · 8:00 PM",
    spots: "8 spots open",
    progress: 25,
  },
  {
    id: "v3",
    icon: "ti-camera",
    iconTint: "gold",
    title: "Photography — Ganesh Festival",
    date: "22 Sep · All day",
    spots: "2 spots",
    progress: 50,
  },
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1",
    tone: "saf",
    badge: "Schedule change",
    icon: "ti-clock",
    title: "Aarti time updated to 7:30 PM",
    body: "Evening aarti moved from 7:00 PM to 7:30 PM from Day 2 onwards.",
    meta: "2 hours ago · Committee",
  },
  {
    id: "a2",
    tone: "tel",
    badge: "General",
    icon: "ti-ticket",
    title: "Dinner bookings close 24 hrs before",
    body: "Book for each day at least 24 hours in advance to guarantee your seat.",
    meta: "5 hours ago · Committee",
  },
  {
    id: "a3",
    tone: "grn",
    badge: "Winner",
    icon: "ti-trophy",
    title: "Drawing competition — winners announced",
    body: "Congratulations to Aarav Shah (1st), Priya Nair (2nd), Rohan Mehta (3rd)!",
    meta: "3 hours ago · Committee",
  },
  {
    id: "a4",
    tone: "gold",
    badge: "Reminder",
    icon: "ti-heart-handshake",
    title: "Volunteers needed for decoration",
    body: "4 more volunteers needed for decoration team on 19 Sep. Apply before tomorrow noon.",
    meta: "4 hours ago · Ravi Mehta",
  },
  {
    id: "a5",
    tone: "red",
    badge: "Alert",
    icon: "ti-droplet",
    title: "Water supply disruption tonight",
    body: "Water off from 8 PM to 11 PM for pipeline maintenance.",
    meta: "6 hours ago · Society Office",
  },
];

export const MY_STATS = [
  { n: "4", l: "Joined", color: "var(--color-teal)", top: "var(--color-teal)" },
  { n: "2", l: "Participating", color: "var(--color-teal)", top: "var(--color-teal)" },
  { n: "1", l: "Volunteering", color: "var(--color-saffron)", top: "var(--color-saffron)" },
  { n: "3", l: "Booked", color: "var(--color-gold)", top: "var(--color-gold)" },
  { n: "2", l: "Interested", color: "var(--color-tx3)", top: "var(--color-teal-mid)" },
];

export const MY_SCHEDULE: ScheduleGroup[] = [
  {
    label: "Today — 20 September",
    items: [
      {
        id: "s1",
        time: "10:00 AM",
        title: "Ganesh arrival",
        event: "Ganesh Festival · Main gate",
        status: { kind: "joined", label: "Joined", icon: "ti-check" },
      },
      {
        id: "s2",
        time: "7:30 PM",
        title: "Evening aarti",
        event: "Ganesh Festival · Mandap",
        status: { kind: "joined", label: "Joined", icon: "ti-check" },
      },
    ],
  },
  {
    label: "Tomorrow — 21 September",
    items: [
      {
        id: "s3",
        time: "6:00 PM",
        title: "Decoration team",
        event: "Ganesh Festival · Garden",
        status: { kind: "volunteer", label: "Volunteering", icon: "ti-heart-handshake" },
      },
    ],
  },
  {
    label: "23 September",
    items: [
      {
        id: "s4",
        time: "8:00 PM",
        title: "Garba and cultural night",
        event: "Ganesh Festival · Garden",
        status: { kind: "participant", label: "Participant · Dance", icon: "ti-sparkles" },
      },
    ],
  },
  {
    label: "24 September",
    items: [
      {
        id: "s5",
        time: "9:00 PM",
        title: "Community dinner",
        event: "Ganesh Festival · Clubhouse · 4 seats · ₹1,000",
        ref: "Ref: #GF-0249",
        status: { kind: "book", label: "Booked", icon: "ti-ticket" },
      },
    ],
  },
];

export const FAMILY_ACTIVITY: {
  id: string;
  initials: string;
  gradient: string;
  name: string;
  detail: string;
  pill: { label: string; kind: "vol" | "part" };
}[] = [
  {
    id: "f1",
    initials: "J",
    gradient: "linear-gradient(135deg,var(--color-teal),var(--color-teal-dark))",
    name: "Jay (you)",
    detail: "Volunteer · Decoration team",
    pill: { label: "Volunteer", kind: "vol" },
  },
  {
    id: "f2",
    initials: "S",
    gradient: "linear-gradient(135deg,var(--color-saffron),var(--color-saffron-dark))",
    name: "Sarth",
    detail: "Chess competition · 22 Sep",
    pill: { label: "Registered", kind: "part" },
  },
];

export const DISCUSSIONS: Discussion[] = [
  {
    id: "d1",
    initials: "JS",
    avatarGradient: "linear-gradient(135deg,var(--color-teal),var(--color-teal-dark))",
    name: "Jay Shah · A-101",
    when: "2 hours ago",
    tagLabel: "Discussion",
    tagKind: "done",
    title: "Ganesh decoration ideas for the mandap this year?",
    preview:
      "Thinking we could go with a floral theme. Last year's peacock design was loved by all. Open to ideas!",
    likes: "14",
    comments: "23 comments",
    follow: true,
  },
  {
    id: "d2",
    initials: "AN",
    avatarGradient: "linear-gradient(135deg,var(--color-saffron),var(--color-saffron-dark))",
    name: "Anil Nair · C-502",
    when: "5 hours ago",
    tagLabel: "Question",
    tagKind: "part",
    title: "Should we plan a community trip after Diwali?",
    preview:
      "Lonavala or Alibaug seem like good options for a 2-day trip. Who's interested?",
    likes: "18 interested",
    comments: "7 replies",
  },
  {
    id: "d3",
    initials: "PM",
    avatarGradient: "linear-gradient(135deg,#2a9050,#1a6a30)",
    name: "Priya Mehta · B-208",
    when: "Yesterday",
    tagLabel: "Help needed",
    tagKind: "book",
    title: "Looking for a badminton partner — mornings",
    preview: "Anyone available for badminton at 6:30–7:30 AM on weekdays?",
    likes: "5",
    comments: "7 replies",
  },
];

export const BIRTHDAYS: Birthday[] = [
  {
    id: "b1",
    initials: "PS",
    avatarGradient: "linear-gradient(135deg,var(--color-saffron),#f07820)",
    name: "Priya Shah",
    detail: "A-204 · Today",
    today: true,
  },
  {
    id: "b2",
    initials: "RM",
    avatarGradient: "linear-gradient(135deg,var(--color-teal),var(--color-teal-dark))",
    name: "Rohan Mehta",
    detail: "B-304 · Today",
    today: true,
  },
  {
    id: "b3",
    initials: "AJ",
    avatarGradient: "linear-gradient(135deg,var(--color-gold),var(--color-gold-light))",
    name: "Ananya Joshi",
    detail: "D-108 · Tomorrow",
    today: false,
  },
];

export const FEED: FeedItem[] = [
  {
    id: "fd1",
    dotColor: "var(--color-saffron)",
    text: "Priya Shah's birthday today — send her a wish!",
    time: "Just now",
  },
  {
    id: "fd2",
    dotColor: "var(--color-teal)",
    text: "18 people just joined the garba workshop on 23 Sep",
    time: "1 hour ago",
  },
  {
    id: "fd3",
    dotColor: "var(--color-gold)",
    text: "4 volunteer spots still open for the decoration team",
    time: "2 hours ago",
  },
  {
    id: "fd4",
    dotColor: "var(--color-saffron-dark)",
    text: "Drawing competition winners announced",
    time: "3 hours ago",
  },
  {
    id: "fd5",
    dotColor: "var(--color-teal-dark)",
    text: "Aarti time updated to 7:30 PM from Day 2 onwards",
    time: "5 hours ago",
  },
];

export const COMMITTEE: Person[] = [
  {
    id: "c1",
    initials: "MK",
    avatarGradient: "linear-gradient(135deg,var(--color-teal),var(--color-teal-dark))",
    name: "Mukesh Kapoor",
    role: "Chairman · B-12",
  },
  {
    id: "c2",
    initials: "RS",
    avatarGradient: "linear-gradient(135deg,var(--color-saffron),var(--color-saffron-dark))",
    name: "Ravi Shah",
    role: "Secretary · A-8",
  },
  {
    id: "c3",
    initials: "PN",
    avatarGradient: "linear-gradient(135deg,var(--color-gold-light),var(--color-gold))",
    name: "Priya Nair",
    role: "Treasurer · C-4",
  },
];
