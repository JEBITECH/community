import { NotificationChannel, NotificationPriority } from './notification.enums';

export interface NotificationRecipient {
  userId?: string;
  email?: string;
  phone?: string;
}

export interface ChannelPreferences {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  inApp?: boolean;
  whatsapp?: boolean;
}

export interface NotificationPayload {
  eventId?: string;
  sourceService: string;
  tenantId?: string;
  organizationId?: string | number;
  recipients: NotificationRecipient[];
  title: string;
  body: string;
  type: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SendNotificationRequest {
  eventType: string;
  entityId?: string | number;
  recipientId?: string | number;
  organizationId?: string | number;
  recipients?: NotificationRecipient[];
  payload?: Record<string, unknown>;
  title?: string;
  body?: string;
  sourceService?: string;
  eventId?: string;
  language?: string;
  priority?: NotificationPriority;
}

export interface ResolvedRecipient {
  userId?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface NotificationJobData {
  notificationId: string;
  eventType: string;
  channel: NotificationChannel;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientUserId?: string;
  subject?: string;
  content: string;
  payload?: Record<string, unknown>;
  organizationId?: string;
}

export interface OrchestratorResult {
  accepted: boolean;
  eventId?: string;
  notificationIds: string[];
  channels: NotificationChannel[];
  skippedReason?: string;
}
