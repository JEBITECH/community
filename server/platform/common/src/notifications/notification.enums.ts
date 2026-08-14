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
  'task.created',
  'task.updated',
  'task.assigned',
  'task.inspection.completed',
  'task.completed',
  'task.upcoming.24h',
  'task.upcoming.1h',
  'task.upcoming.15m',
  'task.overdue',
  'reservation.created',
  'reservation.confirmed',
  'reservation.cancelled',
  'form.submitted',
  'virtual-inspect.task.created',
  'virtual-inspect.task.assigned',
  'virtual-inspect.task.updated',
  'virtual-inspect.inspection.completed',
  'virtual-inspect.task.completed',
  'virtual-inspect.task.upcoming.24h',
  'virtual-inspect.task.upcoming.1h',
  'virtual-inspect.task.upcoming.15m',
  'virtual-inspect.task.overdue',
  'auth.otp',
  'marketing.promotion',
] as const;

export type SupportedEventType = (typeof SUPPORTED_EVENT_TYPES)[number];

export const EVENT_PRIORITY_MAP: Record<string, NotificationPriority> = {
  'auth.otp': NotificationPriority.CRITICAL,
  'task.created': NotificationPriority.HIGH,
  'task.assigned': NotificationPriority.HIGH,
  'task.updated': NotificationPriority.MEDIUM,
  'task.inspection.completed': NotificationPriority.MEDIUM,
  'task.completed': NotificationPriority.MEDIUM,
  'task.upcoming.24h': NotificationPriority.MEDIUM,
  'task.upcoming.1h': NotificationPriority.HIGH,
  'task.upcoming.15m': NotificationPriority.HIGH,
  'task.overdue': NotificationPriority.HIGH,
  'reservation.created': NotificationPriority.HIGH,
  'reservation.confirmed': NotificationPriority.HIGH,
  'reservation.cancelled': NotificationPriority.HIGH,
  'form.submitted': NotificationPriority.MEDIUM,
  'virtual-inspect.task.created': NotificationPriority.HIGH,
  'virtual-inspect.task.assigned': NotificationPriority.HIGH,
  'virtual-inspect.task.updated': NotificationPriority.MEDIUM,
  'virtual-inspect.inspection.completed': NotificationPriority.MEDIUM,
  'virtual-inspect.task.completed': NotificationPriority.MEDIUM,
  'virtual-inspect.task.upcoming.24h': NotificationPriority.MEDIUM,
  'virtual-inspect.task.upcoming.1h': NotificationPriority.HIGH,
  'virtual-inspect.task.upcoming.15m': NotificationPriority.HIGH,
  'virtual-inspect.task.overdue': NotificationPriority.HIGH,
  'marketing.promotion': NotificationPriority.LOW,
};
