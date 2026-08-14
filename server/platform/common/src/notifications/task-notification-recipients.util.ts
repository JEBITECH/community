import { NotificationRecipient } from './notification.types';

export function mergeNotificationRecipients(
  ...recipientGroups: NotificationRecipient[][]
): NotificationRecipient[] {
  const recipientsByUserId = new Map<string, NotificationRecipient>();

  for (const group of recipientGroups) {
    for (const recipient of group) {
      if (!recipient.userId) {
        continue;
      }

      recipientsByUserId.set(recipient.userId, recipient);
    }
  }

  return [...recipientsByUserId.values()];
}

export function mapUsersToNotificationRecipients(
  users: Array<{ id: string; email?: string; phone?: string }>,
): NotificationRecipient[] {
  return users.map((user) => ({
    userId: user.id,
    email: user.email,
    phone: user.phone,
  }));
}
