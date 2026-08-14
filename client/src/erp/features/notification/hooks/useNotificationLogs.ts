import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  getNotificationLogs,
  type NotificationLogsRequestParams,
  type NotificationLogsResponse,
} from "../api";

type UseNotificationLogsOptions = Pick<UseQueryOptions<NotificationLogsResponse, Error>, "enabled">;

export const useNotificationLogs = (params: NotificationLogsRequestParams, options?: UseNotificationLogsOptions) => {
  return useQuery({
    queryKey: [
      "notification-preferences",
      "logs",
      params.organizationId,
      params.page ?? null,
      params.limit ?? null,
      params.notifications?.page ?? null,
      params.notifications?.limit ?? null,
      params.delivery?.page ?? null,
      params.delivery?.limit ?? null,
      params.reminders?.page ?? null,
      params.reminders?.limit ?? null,
    ],
    queryFn: () => getNotificationLogs(params),
    enabled: options?.enabled ?? Boolean(params.organizationId),
    placeholderData: (previousData, previousQuery) => {
      const previousOrganizationId = Array.isArray(previousQuery?.queryKey) ? previousQuery.queryKey[2] : undefined;
      return previousOrganizationId === params.organizationId ? previousData : undefined;
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};
