import { NotificationChannel } from './notification.enums';

export const DEFAULT_NOTIFICATION_CHANNEL_PREFERENCES: Record<
  NotificationChannel,
  boolean
> = {
  [NotificationChannel.EMAIL]: true,
  [NotificationChannel.SMS]: false,
  [NotificationChannel.PUSH]: true,
  [NotificationChannel.WHATSAPP]: false,
  [NotificationChannel.IN_APP]: true,
};

export const DEFAULT_COMPANY_NOTIFICATION_CHANNEL_PREFERENCES = {
  allowEmail: true,
  allowSms: true,
  allowPush: true,
  allowWhatsapp: true,
  allowInApp: true,
};

export const DEFAULT_NOTIFICATION_ROLE_EVENT_PREFERENCES: Record<
  string,
  boolean
> = {
  task_created: true,
  task_updated: true,
  task_assigned: true,
  task_inspection_completed: true,
  task_completed: true,
  task_upcoming_24h: true,
  task_upcoming_1h: true,
  task_upcoming_15m: true,
  task_overdue: true,
  reservation_created: true,
  reservation_confirmed: true,
  reservation_cancelled: true,
  form_submitted: true,
  auth_otp: true,
};

export const DEFAULT_NOTIFICATION_ROLE_NAMES = ['super_admin', 'manager'] as const;

export const DEFAULT_NOTIFICATION_EVENT_TEMPLATE_TYPES = [
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
  'auth.otp',
] as const;

export const NOTIFICATION_EVENT_ALIASES: Record<string, string[]> = {
  'task.created': ['virtual-inspect.task.created'],
  'task.updated': ['virtual-inspect.task.updated'],
  'task.assigned': ['virtual-inspect.task.assigned'],
  'task.inspection.completed': ['virtual-inspect.inspection.completed'],
  'task.completed': [],
  'reservation.created': [],
  'reservation.confirmed': [],
  'reservation.cancelled': [],
  'form.submitted': [],
  'auth.otp': [],
  'marketing.promotion': [],
};

export const NOTIFICATION_ROLE_EVENT_ALIAS_KEYS: Record<string, string[]> = {
  task_created: ['receiveTaskCreationAlerts'],
  task_updated: ['receiveTaskUpdateAlerts'],
  task_assigned: ['receiveTaskAssignmentAlerts'],
  task_inspection_completed: ['receiveInspectionAlerts'],
  task_completed: ['receiveTaskCompletionAlerts'],
  reservation_created: ['receiveReservationAlerts'],
  reservation_confirmed: ['receiveReservationAlerts'],
  reservation_cancelled: ['receiveReservationAlerts'],
  form_submitted: ['receiveFormSubmissionAlerts'],
  auth_otp: ['receiveOtpAlerts'],
  marketing_promotion: ['receiveMarketingAlerts'],
};

export function normalizeNotificationEventType(eventType: string): string {
  return eventType.trim().toLowerCase();
}

export function getNotificationEventCandidates(eventType: string): string[] {
  const normalized = normalizeNotificationEventType(eventType);
  const candidates = new Set<string>([normalized]);

  if (normalized.startsWith('virtual-inspect.')) {
    candidates.add(normalized.replace(/^virtual-inspect\./, ''));
  }

  if (normalized.startsWith('task.')) {
    candidates.add(`virtual-inspect.${normalized}`);
  }

  for (const alias of NOTIFICATION_EVENT_ALIASES[normalized] ?? []) {
    candidates.add(alias);
  }

  return Array.from(candidates);
}

export function getDefaultRoleEventPreferences(
  role?: string,
): Record<string, boolean> {
  return { ...DEFAULT_NOTIFICATION_ROLE_EVENT_PREFERENCES };
}

export function getRoleEventPreferenceKeys(eventType: string): string[] {
  const normalized = normalizeNotificationEventType(eventType).replace(/\./g, '_');
  const legacyAliases = NOTIFICATION_ROLE_EVENT_ALIAS_KEYS[normalized] ?? [];
  return [normalized, ...legacyAliases];
}
