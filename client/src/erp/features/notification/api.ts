import { apiRequest } from "@/lib/queryClient";

// Notification Preferences
export type NotificationChannels = {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  inApp?: boolean;
  whatsapp?: boolean;
};

export type CompanyNotificationChannels = {
  allowEmail?: boolean;
  allowSms?: boolean;
  allowPush?: boolean;
  allowWhatsapp?: boolean;
  allowInApp?: boolean;
};

export type NotificationTemplatePayload = {
  name?: string | null;
  description?: string | null;
  eventType: string;
  channel: string;
  language?: string;
  organizationId?: number | null;
  category?: string | null;
  type?: string | null;
  htmlContent?: string | null;
  textContent?: string | null;
  jsonContent?: string | null;
  variables?: string[] | null;
  preheader?: string | null;
  subject?: string | null;
  template: string;
  status?: string | null;
  isDefault?: boolean;
  version?: number;
  isActive?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  fallbackTemplateId?: number | null;
};

export const getNotificationPreferences = (params: {
  organizationId: number;
  userId?: string;
  role?: string;
}) => {
  const query = new URLSearchParams();
  query.append("organization_id", String(params.organizationId));
  if (params.userId) query.append("user_id", params.userId);
  if (params.role) query.append("role", params.role);
  return apiRequest("GET", `/notifications/notification-preferences?${query.toString()}`).then(res => res.json());
};

export type NotificationLogPagination = {
  page?: number;
  limit?: number;
};

export type NotificationLogsRequestParams = {
  organizationId: number;
  page?: number;
  limit?: number;
  notifications?: NotificationLogPagination;
  delivery?: NotificationLogPagination;
};

export type NotificationLogsPaginationMeta = {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
};

export type NotificationRecipientPreview = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

export type NotificationLogItem = {
  id: string;
  eventType: string;
  subject: string | null;
  content: string | null;
  recipientId: string | null;
  channel: string;
  status: string;
  createdAt: string;
  recipient: NotificationRecipientPreview | null;
};

export type NotificationDeliveryLogItem = {
  id: number;
  provider: string;
  status: string;
  attemptNumber: number;
  failureReason: string | null;
  createdAt: string;
  notification: {
    eventType: string;
    channel: string;
    recipient: NotificationRecipientPreview | null;
  } | null;
};

export type NotificationLogsResponse = {
  notifications: {
    data: NotificationLogItem[];
    meta: NotificationLogsPaginationMeta;
  };
  deliveryLogs: {
    data: NotificationDeliveryLogItem[];
    meta: NotificationLogsPaginationMeta;
  };
};

const appendLogPagination = (
  query: URLSearchParams,
  prefix: "notifications" | "delivery",
  pagination?: NotificationLogPagination,
  fallback?: NotificationLogPagination,
) => {
  const page = pagination?.page ?? fallback?.page;
  const limit = pagination?.limit ?? fallback?.limit;

  if (page != null) {
    query.append(`${prefix}_page`, String(page));
  }

  if (limit != null) {
    query.append(`${prefix}_limit`, String(limit));
  }
};

export const getNotificationLogs = (params: NotificationLogsRequestParams): Promise<NotificationLogsResponse> => {
  const query = new URLSearchParams();
  query.append("organization_id", String(params.organizationId));
  appendLogPagination(query, "notifications", params.notifications, { page: params.page, limit: params.limit });
  appendLogPagination(query, "delivery", params.delivery, { page: params.page, limit: params.limit });
  return apiRequest("GET", `/notifications/notification-preferences/logs?${query.toString()}`).then(res => res.json());
};

export const saveCompanyNotificationPreference = (data: {
  organizationId: number;
  channels: CompanyNotificationChannels;
}) => apiRequest("POST", "/notifications/notification-preferences/company", data).then(res => res.json());

export const saveUserNotificationPreference = (data: {
  userId: string;
  organizationId?: number;
  channels: NotificationChannels;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
  doNotDisturb?: boolean;
}) => apiRequest("POST", "/notifications/notification-preferences/user", data).then(res => res.json());

export const saveRoleNotificationPreference = (data: {
  role: string;
  roleId?: number;
  organizationId?: number;
  eventPreferences: Record<string, boolean>;
}) => apiRequest("POST", "/notifications/notification-preferences/role", data).then(res => res.json());

export const getDeviceTokens = (params: { organizationId?: number; userId?: string }) => {
  const query = new URLSearchParams();
  if (params.organizationId != null) query.append("organization_id", String(params.organizationId));
  if (params.userId) query.append("user_id", params.userId);
  return apiRequest("GET", `/notifications/notification-preferences/device-tokens?${query.toString()}`).then(res => res.json());
};

export const saveDeviceToken = (data: {
  userId: string;
  organizationId?: number;
  token: string;
  platform: string;
  isActive?: boolean;
}) => apiRequest("POST", "/notifications/notification-preferences/device-tokens", data).then(res => res.json());

export const updateDeviceToken = (id: number, data: { isActive?: boolean; lastSeenAt?: string }) =>
  apiRequest("PATCH", `/notifications/notification-preferences/device-tokens/${id}`, data).then(res => res.json());

// Notification Templates
export const getNotificationTemplates = (params: {
  organizationId?: number;
  eventType?: string;
  channel?: string;
  language?: string;
  search?: string;
}) => {
  const query = new URLSearchParams();
  if (params.organizationId != null) query.append("organization_id", String(params.organizationId));
  if (params.eventType) query.append("event_type", params.eventType);
  if (params.channel) query.append("channel", params.channel);
  if (params.language) query.append("language", params.language);
  if (params.search) query.append("search", params.search);
  return apiRequest("GET", `/notifications/notification-templates?${query.toString()}`).then(res => res.json());
};

export const createNotificationTemplate = (data: NotificationTemplatePayload) =>
  apiRequest("POST", "/notifications/notification-templates", data).then(res => res.json());

export const updateNotificationTemplate = (id: number, data: Partial<NotificationTemplatePayload>) =>
  apiRequest("PATCH", `/notifications/notification-templates/${id}`, data).then(res => res.json());

export const deleteNotificationTemplate = (id: number) =>
  apiRequest("DELETE", `/notifications/notification-templates/${id}`).then(res => res.json());

export const previewNotificationTemplate = (data: {
  subject?: string | null;
  template: string;
  variables?: Record<string, unknown>;
}) => apiRequest("POST", "/notifications/notification-templates/preview", data).then(res => res.json());

export const testNotificationTemplate = (id: number, variables: Record<string, unknown>) =>
  apiRequest("POST", `/notifications/notification-templates/${id}/test`, { variables }).then(res => res.json());
