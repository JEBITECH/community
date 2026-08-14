export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';

export const NOTIFICATION_EVENTS = {
  VIRTUAL_INSPECT_NOTIFICATION: 'virtual-inspect.notification',
  SEND_NOTIFICATION: 'notification.send',
  BOOTSTRAP_COMPANY_PREFERENCE: 'notification.bootstrap.company-preference',
  BOOTSTRAP_ROLE_PREFERENCE: 'notification.bootstrap.role-preference',
  BOOTSTRAP_USER_PREFERENCE: 'notification.bootstrap.user-preference',
  // Booking engine events
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CONFIRMED: 'reservation.confirmed',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  // Form submission events (guest info, contact us, etc.)
  FORM_SUBMITTED: 'form.submitted',
} as const;

export type NotificationEventName =
  (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];

export const DEFAULT_NOTIFICATION_LANGUAGE = 'en';
