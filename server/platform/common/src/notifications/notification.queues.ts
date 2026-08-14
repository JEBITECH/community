export const NOTIFICATION_QUEUES = {
  EMAIL: 'notificationEmailQueue',
  SMS: 'notificationSmsQueue',
  PUSH: 'notificationPushQueue',
  WHATSAPP: 'notificationWhatsappQueue',
  IN_APP: 'notificationInAppQueue',
  EMAIL_DLQ: 'notificationEmailFailedQueue',
  SMS_DLQ: 'notificationSmsFailedQueue',
  PUSH_DLQ: 'notificationPushFailedQueue',
} as const;

export const NOTIFICATION_JOBS = {
  SEND_EMAIL: 'sendEmail',
  SEND_SMS: 'sendSms',
  SEND_PUSH: 'sendPush',
  SEND_WHATSAPP: 'sendWhatsapp',
  SEND_IN_APP: 'sendInApp',
} as const;

export const NOTIFICATION_QUEUE_CONFIG = {
  attempts: 5,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: 1000,
  removeOnFail: false,
};
