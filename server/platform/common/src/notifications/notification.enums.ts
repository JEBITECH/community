export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
  IN_APP = 'inApp',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationPriority {
  CRITICAL = 1,
  HIGH = 2,
  MEDIUM = 3,
  LOW = 4,
}

export const DEFAULT_CHANNEL_PREFERENCES: Record<NotificationChannel, boolean> = {
  [NotificationChannel.EMAIL]: true,
  [NotificationChannel.SMS]: false,
  [NotificationChannel.PUSH]: true,
  [NotificationChannel.WHATSAPP]: false,
  [NotificationChannel.IN_APP]: true,
};

export const SUPPORTED_EVENT_TYPES = [
  'reservation.created',
  'reservation.confirmed',
  'reservation.cancelled',
  'form.submitted',
  'auth.otp',
  'marketing.promotion',
  'community.announcement_published',
] as const;

export type SupportedEventType = (typeof SUPPORTED_EVENT_TYPES)[number];

export const EVENT_PRIORITY_MAP: Record<string, NotificationPriority> = {
  'auth.otp': NotificationPriority.CRITICAL,
  'reservation.created': NotificationPriority.HIGH,
  'reservation.confirmed': NotificationPriority.HIGH,
  'reservation.cancelled': NotificationPriority.HIGH,
  'form.submitted': NotificationPriority.MEDIUM,
  'marketing.promotion': NotificationPriority.LOW,
  'community.announcement_published': NotificationPriority.HIGH,
};
