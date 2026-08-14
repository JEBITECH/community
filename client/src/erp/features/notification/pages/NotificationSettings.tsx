import { ReactNode, useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useOrganizationContext } from "@/contexts/OrganizationContext";
import AppTimePicker from "@/components/reusable ui/AppTimePicker";
import { TimezoneCombobox } from "@/components/reusable ui/TimezoneCombobox";
import { Bell, MessageSquare, Plus, Save, Trash2, CheckCircle2, CircleAlert, History } from "lucide-react";
import {
  NotificationChannels,
  deleteNotificationTemplate,
  getDeviceTokens,
  getNotificationPreferences,
  getNotificationTemplates,
  saveDeviceToken,
  saveRoleNotificationPreference,
  saveUserNotificationPreference,
  updateDeviceToken,
  type NotificationLogsPaginationMeta,
  type NotificationLogsResponse,
} from "../api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { capitalizeWords } from "@/utils/helper";
import { useGetRolesByOrganization } from "@/erp/features/acl-management";
import { useGetUserByOrganizationId } from "@/erp/features/user-management";
import { useNotificationLogs } from "../hooks/useNotificationLogs";
import { NotificationTemplateBuilderDialog, type NotificationTemplateRecord } from "./NotificationTemplateBuilderDialog";

type TabKey = "preferences" | "templates" | "devices" | "logs";

type LogSubTabKey = "notifications" | "delivery" | "reminders";

type LogPaginationState = {
  page: number;
  limit: number;
};

type LogsPaginationState = Record<LogSubTabKey, LogPaginationState>;

type NotificationUserPreference = {
  id?: number;
  userId?: string;
  organizationId?: number | null;
  channels?: NotificationChannels;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string | null;
  doNotDisturb?: boolean;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

type NotificationRolePreference = {
  id?: number;
  role?: string;
  roleId?: number | null;
  organizationId?: number | null;
  eventPreferences?: Record<string, boolean>;
};

type NotificationPreferencesResponse = {
  company: { channels?: Record<string, boolean> } | null;
  user: NotificationUserPreference | null;
  role: NotificationRolePreference | null;
  userPreferences?: NotificationUserPreference[];
  rolePreferences?: NotificationRolePreference[];
  deviceTokens: DeviceToken[];
};

type UserOption = {
  label: string;
  value: string;
};

type RoleOption = {
  label: string;
  value: string;
};

type DeviceToken = {
  id: number;
  userId: string;
  organizationId?: number | null;
  token: string;
  platform: string;
  isActive: boolean;
  lastSeenAt?: string | null;
  updatedAt?: string;
};

const userChannelDefaults: NotificationChannels = {
  email: true,
  sms: false,
  push: true,
  inApp: true,
  whatsapp: false,
};

const roleEventDefaults: Record<string, boolean> = {
  task_created: true,
  task_updated: true,
  task_assigned: true,
  task_inspection_completed: true,
  task_completed: true,
  task_upcoming_24h: true,
  task_upcoming_1h: true,
  task_upcoming_15m: true,
  task_overdue: true,
  reservation_created: false,
  auth_otp: true,
  receiveInspectionAlerts: true,
  receiveTaskAssignmentAlerts: true,
  receiveReservationAlerts: false,
  receiveEscalationAlerts: true,
};

const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-disabled={disabled}
    onClick={disabled ? undefined : onChange}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${checked ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}`}
  >
    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
  </button>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
    <span>{label}</span>
    {children}
  </label>
);

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-950";

const textareaClass =
  "min-h-[130px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-950";

const TIMEZONE_FALLBACK = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const CHANNEL_LABELS: Record<keyof NotificationChannels, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push",
  inApp: "In-App",
  whatsapp: "WhatsApp",
};

const ROLE_EVENT_LABELS: Record<string, string> = {
  task_created: "Task created",
  task_updated: "Task updated",
  task_assigned: "Task assigned",
  task_inspection_completed: "Inspection completed",
  task_completed: "Task completed",
  task_upcoming_24h: "Task upcoming (24 hours)",
  task_upcoming_1h: "Task upcoming (1 hour)",
  task_upcoming_15m: "Task upcoming (15 minutes)",
  task_overdue: "Task overdue",
  reservation_created: "Reservation created",
  auth_otp: "OTP / authentication",
  receiveInspectionAlerts: "Inspection alerts",
  receiveTaskAssignmentAlerts: "Task assignment alerts",
  receiveReservationAlerts: "Reservation alerts",
  receiveEscalationAlerts: "Escalation alerts",
  receiveTaskCreationAlerts: "Task creation alerts",
  receiveTaskUpdateAlerts: "Task update alerts",
  receiveTaskCompletionAlerts: "Task completion alerts",
  receiveOtpAlerts: "OTP alerts",
  receiveMarketingAlerts: "Marketing alerts",
};

const formatLabel = (value: string) => value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatTime = (value?: string | null) => {
  if (!value) return "Not set";
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const buildUserFullName = (user: { firstName?: string | null; lastName?: string | null; email?: string | null }) => {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return fullName || user.email || "Unnamed user";
};

const renderBooleanBadge = (checked: boolean) => (
  <Badge variant={checked ? "default" : "secondary"} className={checked ? "bg-emerald-600 hover:bg-emerald-800" : "bg-red-400 hover:bg-red-600"}>
    {checked ? "Enabled" : "Disabled"}
  </Badge>
);

const LOG_PAGE_SIZE = 10;

const createDefaultLogsPagination = (): LogsPaginationState => ({
  notifications: { page: 1, limit: LOG_PAGE_SIZE },
  delivery: { page: 1, limit: LOG_PAGE_SIZE },
  reminders: { page: 1, limit: LOG_PAGE_SIZE },
});

const buildEmptyLogSectionMeta = (currentPage: number, itemsPerPage: number): NotificationLogsPaginationMeta => ({
  totalItems: 0,
  itemCount: 0,
  itemsPerPage,
  totalPages: 0,
  currentPage,
});

const buildEmptyLogsResponse = (pagination: LogsPaginationState): NotificationLogsResponse => ({
  notifications: {
    data: [],
    meta: buildEmptyLogSectionMeta(pagination.notifications.page, pagination.notifications.limit),
  },
  deliveryLogs: {
    data: [],
    meta: buildEmptyLogSectionMeta(pagination.delivery.page, pagination.delivery.limit),
  },
  reminderLogs: {
    data: [],
    meta: buildEmptyLogSectionMeta(pagination.reminders.page, pagination.reminders.limit),
  },
});

const getVisiblePageNumbers = (currentPage: number, totalPages: number) => {
  if (totalPages <= 0) {
    return [];
  }

  const visiblePages: number[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let page = 1; page <= totalPages; page += 1) {
      visiblePages.push(page);
    }
    return visiblePages;
  }

  if (currentPage <= 3) {
    for (let page = 1; page <= maxVisible; page += 1) {
      visiblePages.push(page);
    }
    return visiblePages;
  }

  if (currentPage >= totalPages - 2) {
    for (let page = totalPages - 4; page <= totalPages; page += 1) {
      visiblePages.push(page);
    }
    return visiblePages;
  }

  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    visiblePages.push(page);
  }

  return visiblePages;
};

const renderLogPagination = (meta: NotificationLogsPaginationMeta, onPageChange: (page: number) => void) => {
  const { currentPage, totalPages, totalItems, itemsPerPage } = meta;
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIndex = totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems);
  const visiblePages = getVisiblePageNumbers(currentPage, totalPages);

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {startIndex}-{endIndex} of {totalItems} logs
      </p>

      {totalPages > 1 && (
        <Pagination className="mx-0 justify-start sm:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>

            {visiblePages.map((page) => (
              <PaginationItem key={page}>
                <PaginationLink isActive={currentPage === page} size="default" onClick={() => onPageChange(page)}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

const NotificationSettingsPage = () => {
  const { selectedOrganizationId } = useOrganizationContext();
  const [activeTab, setActiveTab] = useState<TabKey>("preferences");
  const [status, setStatus] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferencesResponse>({
    company: null,
    user: null,
    role: null,
    userPreferences: [],
    rolePreferences: [],
    deviceTokens: [],
  });
  const [logsPagination, setLogsPagination] = useState<LogsPaginationState>(createDefaultLogsPagination);
  const [activeLogSubTab, setActiveLogSubTab] = useState<LogSubTabKey>("notifications");

  const [userId, setUserId] = useState("all");
  const [role, setRole] = useState("all");
  const [userChannels, setUserChannels] = useState(userChannelDefaults);
  const [roleEvents, setRoleEvents] = useState(roleEventDefaults);
  const [quietHoursStart, setQuietHoursStart] = useState("");
  const [quietHoursEnd, setQuietHoursEnd] = useState("");
  const [timezone, setTimezone] = useState(TIMEZONE_FALLBACK);
  const [doNotDisturb, setDoNotDisturb] = useState(false);

  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [isTemplateBuilderOpen, setIsTemplateBuilderOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplateRecord | null>(null);

  const [deviceTokens, setDeviceTokens] = useState<DeviceToken[]>([]);
  const [deviceUserId, setDeviceUserId] = useState("");
  const [devicePlatform, setDevicePlatform] = useState("web");
  const [deviceToken, setDeviceToken] = useState("");

  const organizationId = selectedOrganizationId || undefined;
  const { data: rolesData } = useGetRolesByOrganization(organizationId ? String(organizationId) : "");
  const { data: organizationUsersData } = useGetUserByOrganizationId(organizationId, {
    enabled: !!organizationId,
  });
  const {
    data: notificationLogs,
    isLoading: isNotificationLogsLoading,
    isFetching: isNotificationLogsFetching,
    error: notificationLogsError,
    refetch: refreshNotificationLogs,
  } = useNotificationLogs(
    {
      organizationId: organizationId || 0,
      notifications: logsPagination.notifications,
      delivery: logsPagination.delivery,
      reminders: logsPagination.reminders,
    },
    {
      enabled: activeTab === "logs" && Boolean(organizationId),
    },
  );

  const logs = useMemo(() => notificationLogs ?? buildEmptyLogsResponse(logsPagination), [notificationLogs, logsPagination]);

  const logsErrorMessage = notificationLogsError instanceof Error ? notificationLogsError.message : null;
  const isLogsInitialLoading = isNotificationLogsLoading && !notificationLogs;
  const isLogsRefreshing = isNotificationLogsFetching && Boolean(notificationLogs);

  useEffect(() => {
    setLogsPagination(createDefaultLogsPagination());
    setActiveLogSubTab("notifications");
  }, [organizationId]);

  const setLogPage = (section: LogSubTabKey, page: number) => {
    setLogsPagination((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        page,
      },
    }));
  };

  const tabs = useMemo(
    () => [
      { key: "preferences" as const, label: "Preferences", icon: Bell },
      { key: "templates" as const, label: "Templates", icon: MessageSquare },
      // { key: "devices" as const, label: "Device Tokens", icon: Smartphone },
      { key: "logs" as const, label: "Logs", icon: History },
    ],
    [],
  );

  const organizationUsers = useMemo<UserOption[]>(() => {
    const users = organizationUsersData?.users ?? organizationUsersData?.data ?? [];
    return Array.isArray(users)
      ? users.map((user: any) => ({
          value: user.id,
          label: buildUserFullName(user),
        }))
      : [];
  }, [organizationUsersData]);

  const roleOptions = useMemo<RoleOption[]>(() => {
    const roles = rolesData?.role_list ?? rolesData?.roleList ?? [];
    return Array.isArray(roles)
      ? roles.map((entry: any) => ({
          value: entry.name,
          label: capitalizeWords(entry.name),
        }))
      : [];
  }, [rolesData]);

  const loadPreferences = async (filters?: { role?: string; userId?: string }) => {
    if (!organizationId) return;
    const data = (await getNotificationPreferences({
      organizationId,
      userId: filters?.userId && filters.userId !== "all" ? filters.userId : undefined,
      role: filters?.role && filters.role !== "all" ? filters.role : undefined,
    })) as NotificationPreferencesResponse;

    setPreferences({
      company: data.company ?? null,
      user: data.user ?? null,
      role: data.role ?? null,
      userPreferences: data.userPreferences ?? [],
      rolePreferences: data.rolePreferences ?? [],
      deviceTokens: data.deviceTokens ?? [],
    });

    if (filters?.userId && filters.userId !== "all" && data.user?.channels) {
      setUserChannels({ ...userChannelDefaults, ...data.user.channels });
      setQuietHoursStart(data.user.quietHoursStart || "");
      setQuietHoursEnd(data.user.quietHoursEnd || "");
      setTimezone(data.user.timezone || TIMEZONE_FALLBACK);
      setDoNotDisturb(Boolean(data.user.doNotDisturb));
    }

    if (filters?.role && filters.role !== "all" && data.role?.eventPreferences) {
      setRoleEvents({ ...roleEventDefaults, ...data.role.eventPreferences });
    }
  };

  const loadTemplates = async () => {
    const data = await getNotificationTemplates({ organizationId, search: templateSearch || undefined });
    setTemplates(data);
  };

  const loadDeviceTokens = async () => {
    const data = await getDeviceTokens({
      organizationId,
      userId: deviceUserId || (userId !== "all" ? userId : undefined),
    });
    setDeviceTokens(data);
  };

  useEffect(() => {
    if (!organizationId) return;
    loadPreferences({ role, userId }).catch(() => setStatus("Unable to load notification preferences."));
  }, [organizationId, role, userId]);

  useEffect(() => {
    if (!organizationId) return;
    loadTemplates().catch(() => setStatus("Unable to load notification templates."));
  }, [organizationId]);

  useEffect(() => {
    if (!organizationId) return;
    loadDeviceTokens().catch(() => setStatus("Unable to load device tokens."));
  }, [organizationId, userId, deviceUserId]);

  const saveSection = async (section: "user" | "role") => {
    if (!organizationId) {
      setStatus("Select an organization before saving notification settings.");
      return;
    }
    if (section === "user" && userId === "all") {
      setStatus("Select a user before saving user notification preferences.");
      return;
    }
    if (section === "role" && role === "all") {
      setStatus("Select a role before saving role notification preferences.");
      return;
    }
    setIsSaving(true);
    try {
      if (section === "user") {
        await saveUserNotificationPreference({
          userId,
          organizationId,
          channels: userChannels,
          quietHoursStart: quietHoursStart || undefined,
          quietHoursEnd: quietHoursEnd || undefined,
          timezone: timezone || undefined,
          doNotDisturb,
        });
      }
      if (section === "role") {
        await saveRoleNotificationPreference({ role, organizationId, eventPreferences: roleEvents });
      }
      setStatus("Notification preferences saved successfully.");
      await loadPreferences({ role, userId });
    } catch (error: any) {
      setStatus(error?.message || "Unable to save notification preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveToken = async () => {
    if (!organizationId) {
      setStatus("Select an organization before saving device tokens.");
      return;
    }
    const selectedUserId = deviceUserId || (userId !== "all" ? userId : "");
    if (!selectedUserId) {
      setStatus("Select a user before saving a device token.");
      return;
    }
    try {
      await saveDeviceToken({
        userId: selectedUserId,
        organizationId,
        token: deviceToken,
        platform: devicePlatform,
        isActive: true,
      });
      setDeviceToken("");
      setStatus("Device token saved successfully.");
      await loadDeviceTokens();
    } catch (error: any) {
      setStatus(error?.message || "Unable to save device token.");
    }
  };

  const rolePreferenceOptions = useMemo(() => [{ label: "All roles", value: "all" }, ...roleOptions], [roleOptions]);

  const userPreferenceOptions = useMemo(() => [{ label: "All users", value: "all" }, ...organizationUsers], [organizationUsers]);

  const visibleRolePreferences = preferences.rolePreferences ?? [];
  const visibleUserPreferences = preferences.userPreferences ?? [];
  const notificationLogSection = logs.notifications;
  const deliveryLogSection = logs.deliveryLogs;
  const reminderLogSection = logs.reminderLogs;

  return (
    <Layout title="Notification Settings" subtitle="Manage delivery preferences, reusable templates, and device tokens">
      <div className="px-6 pt-5 pb-10 space-y-5">
        <Card className="overflow-hidden border border-border/70 bg-gradient-to-br from-primary/8 via-card to-background shadow-sm dark:from-primary/10 dark:via-card dark:to-background">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <Bell className="h-4 w-4" />
                  Notification Center
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">Preferences, templates, and delivery readiness</h2>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    Configure channel permissions, role event alerts, localized template versions, preview data, and registered push devices from one
                    operational screen.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Organization ID</p>
                <div className="mt-2 text-2xl font-semibold text-foreground">{organizationId || "Not selected"}</div>
                <p className="mt-1 text-sm text-muted-foreground">Active workspace</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {status && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {status}
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">User Preferences</CardTitle>
                      <p className="text-sm text-muted-foreground">Choose a user by full name, then edit access timing.</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {visibleUserPreferences.length > 0 ? `${visibleUserPreferences.length} loaded` : "No user prefs"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select value={userId} onValueChange={setUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {userPreferenceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Quiet hours start</Label>
                      <AppTimePicker
                        value={quietHoursStart || null}
                        onChange={(val) => setQuietHoursStart(val || "")}
                        disabled={isSaving || userId === "all"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quiet hours end</Label>
                      <AppTimePicker value={quietHoursEnd || null} onChange={(val) => setQuietHoursEnd(val || "")} disabled={isSaving || userId === "all"} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <TimezoneCombobox value={timezone} onChange={setTimezone} disabled={isSaving || userId === "all"} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <span className="text-sm font-medium">Do Not Disturb</span>
                    <Toggle checked={doNotDisturb} disabled={isSaving || userId === "all"} onChange={() => setDoNotDisturb((prev) => !prev)} />
                  </div>

                  <div className="space-y-3">
                    {Object.entries(userChannels).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                        <span className="text-sm font-medium">{CHANNEL_LABELS[key as keyof NotificationChannels]}</span>
                        <Toggle
                          checked={Boolean(value)}
                          disabled={isSaving || userId === "all"}
                          onChange={() =>
                            setUserChannels((prev) => ({
                              ...prev,
                              [key]: !prev[key as keyof NotificationChannels],
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={() => saveSection("user")} disabled={isSaving || userId === "all"} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save User Preferences
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900 xl:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Role Preferences</CardTitle>
                      <p className="text-sm text-muted-foreground">Select a role to filter and edit event alerts.</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {visibleRolePreferences.length > 0 ? `${visibleRolePreferences.length} loaded` : "No role prefs"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {rolePreferenceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(roleEvents).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                        <span className="text-sm font-medium">{ROLE_EVENT_LABELS[key] || formatLabel(key)}</span>
                        <Toggle
                          checked={Boolean(value)}
                          disabled={isSaving || role === "all"}
                          onChange={() =>
                            setRoleEvents((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={() => saveSection("role")} disabled={isSaving || role === "all"} className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Role Preferences
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Readable Preference List</CardTitle>
                    <p className="text-sm text-muted-foreground">A human-friendly snapshot of the loaded role and user notification settings.</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Loaded from the current organization
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <h4 className="font-semibold">Role Preferences</h4>
                    <Badge variant="secondary">{visibleRolePreferences.length} record(s)</Badge>
                  </div>
                  {visibleRolePreferences.length > 0 ? (
                    <div className="space-y-3">
                      {visibleRolePreferences.map((pref) => (
                        <div
                          key={`${pref.role}-${pref.roleId ?? "na"}`}
                          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-semibold">{capitalizeWords(pref.role || "Role preference")}</div>
                            <Badge variant="outline">Role preference</Badge>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(pref.eventPreferences || {}).map(([eventKey, enabled]) => (
                              <Badge
                                key={eventKey}
                                variant={enabled ? "default" : "secondary"}
                                className={enabled ? "bg-emerald-600 hover:bg-emerald-800" : "bg-red-400 hover:bg-red-600"}
                              >
                                {ROLE_EVENT_LABELS[eventKey] || formatLabel(eventKey)}: {enabled ? "On" : "Off"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-muted-foreground">
                      No role preferences found for the selected organization.
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <h4 className="font-semibold">User Preferences</h4>
                    <Badge variant="secondary">{visibleUserPreferences.length} record(s)</Badge>
                  </div>
                  {visibleUserPreferences.length > 0 ? (
                    <div className="space-y-3">
                      {visibleUserPreferences.map((pref) => (
                        <div key={pref.userId} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">{buildUserFullName(pref.user || {})}</div>
                              <p className="text-sm text-muted-foreground">{pref.user?.email || pref.userId}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {renderBooleanBadge(Boolean(pref.doNotDisturb))}
                              <Badge variant="outline">
                                {formatTime(pref.quietHoursStart)} - {formatTime(pref.quietHoursEnd)}
                              </Badge>
                              <Badge variant="outline">{pref.timezone || TIMEZONE_FALLBACK}</Badge>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(pref.channels || {}).map(([channelKey, enabled]) => (
                              <Badge
                                key={channelKey}
                                variant={enabled ? "default" : "secondary"}
                                className={enabled ? "bg-emerald-600 hover:bg-emerald-800" : "bg-red-400 hover:bg-red-600"}
                              >
                                {CHANNEL_LABELS[channelKey as keyof NotificationChannels]}: {enabled ? "On" : "Off"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-muted-foreground">
                      No user preferences found for the selected organization.
                    </div>
                  )}
                </div>

                {(!visibleRolePreferences.length || !visibleUserPreferences.length) && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    Select a role or user to narrow the edit view. The summary list always shows the current organization scope.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "templates" && (
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold">Template Library</h3>
                  <p className="text-sm text-muted-foreground">Search, edit, or create notification templates in the builder popup.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={templateSearch}
                    onChange={(event) => setTemplateSearch(event.target.value)}
                    className={inputClass}
                    placeholder="Search templates"
                  />
                  <Button type="button" variant="outline" onClick={() => loadTemplates().catch(() => setStatus("Unable to load notification templates."))}>
                    Search
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(null);
                      setIsTemplateBuilderOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Template
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                    <tr>
                      <th className="px-3 py-3">Name</th>
                      <th className="px-3 py-3">Event</th>
                      <th className="px-3 py-3">Channel</th>
                      <th className="px-3 py-3">Locale</th>
                      <th className="px-3 py-3">Version</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-3 py-3 font-medium">
                          {template.name || template.subject || template.eventType}
                          <div className="text-xs text-muted-foreground">{template.eventType || template.channel || "No routing info"}</div>
                        </td>
                        <td className="px-3 py-3">{template.eventType}</td>
                        <td className="px-3 py-3">{template.channel}</td>
                        <td className="px-3 py-3">{template.language}</td>
                        <td className="px-3 py-3">v{template.version}</td>
                        <td className="px-3 py-3">
                          <Badge
                            variant={template.isActive ? "default" : "secondary"}
                            className={template.isActive ? "bg-emerald-600 hover:bg-emerald-800" : ""}
                          >
                            {template.status || (template.isActive ? "active" : "inactive")}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setIsTemplateBuilderOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await deleteNotificationTemplate(template.id);
                                await loadTemplates();
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === "devices" && (
          <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-4 font-semibold">Register Device Token</h3>
              <div className="space-y-3">
                <Field label="User ID">
                  <input
                    value={deviceUserId}
                    onChange={(event) => setDeviceUserId(event.target.value)}
                    className={inputClass}
                    placeholder={userId !== "all" ? userId : "Select a user"}
                  />
                </Field>
                <Field label="Platform">
                  <input
                    value={devicePlatform}
                    onChange={(event) => setDevicePlatform(event.target.value)}
                    className={inputClass}
                    placeholder="web / ios / android"
                  />
                </Field>
                <Field label="Token">
                  <textarea value={deviceToken} onChange={(event) => setDeviceToken(event.target.value)} className={textareaClass} />
                </Field>
                <button
                  onClick={saveToken}
                  disabled={!deviceToken || !(deviceUserId || userId !== "all")}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> Save Token
                </button>
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Registered Tokens</h3>
                <button onClick={loadDeviceTokens} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700">
                  Refresh
                </button>
              </div>
              <div className="space-y-3">
                {deviceTokens.map((token) => (
                  <div key={token.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {token.platform} · {token.userId}
                        </p>
                        <p className="mt-1 break-all text-xs text-slate-500">{token.token}</p>
                      </div>
                      <button
                        onClick={async () => {
                          await updateDeviceToken(token.id, { isActive: !token.isActive });
                          await loadDeviceTokens();
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${token.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {token.isActive ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </div>
                ))}
                {!deviceTokens.length && <p className="text-sm text-slate-500">No device tokens found for the selected filters.</p>}
              </div>
            </section>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Notification & Dispatch Logs</CardTitle>
                    <p className="text-sm text-muted-foreground">Monitor real-time status of notifications, delivery attempts, and task reminders.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isNotificationLogsFetching}
                    onClick={() => {
                      void refreshNotificationLogs();
                    }}
                    className="self-start sm:self-auto"
                  >
                    {isLogsRefreshing ? "Refreshing Logs..." : "Refresh Logs"}
                  </Button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["notifications", "delivery", "reminders"] as const).map((subTab) => (
                    <button
                      key={subTab}
                      type="button"
                      onClick={() => setActiveLogSubTab(subTab)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        activeLogSubTab === subTab
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {subTab === "notifications" && `Notifications (${notificationLogSection.meta.totalItems})`}
                      {subTab === "delivery" && `Delivery Attempts (${deliveryLogSection.meta.totalItems})`}
                      {subTab === "reminders" && `Reminders (${reminderLogSection.meta.totalItems})`}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {logsErrorMessage && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                    {logsErrorMessage}
                  </div>
                )}

                {isLogsInitialLoading ? (
                  <div className="py-10 text-center text-sm text-slate-500">Loading log entries...</div>
                ) : (
                  <div className="overflow-x-auto">
                    {activeLogSubTab === "notifications" && (
                      <div className="space-y-4">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                            <tr>
                              <th className="px-4 py-3">Event Details</th>
                              <th className="px-4 py-3">Recipient</th>
                              <th className="px-4 py-3">Channel</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {notificationLogSection.data.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">{item.eventType}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{item.subject || "No Subject"}</div>
                                  {item.content && (
                                    <div className="text-xs text-slate-400 mt-1 max-w-md truncate" title={item.content}>
                                      {item.content}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {item.recipient ? (
                                    <div>
                                      <div className="font-medium">{buildUserFullName(item.recipient)}</div>
                                      <div className="text-xs text-slate-500">{item.recipient.email}</div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">System / ID: {item.recipientId || "None"}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className="uppercase tracking-wide text-[10px]">
                                    {item.channel}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant={item.status === "SENT" ? "default" : "secondary"}
                                    className={
                                      item.status === "SENT"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : item.status === "FAILED"
                                          ? "bg-red-500 hover:bg-red-600 text-white"
                                          : "bg-amber-500 hover:bg-amber-600 text-white"
                                    }
                                  >
                                    {item.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                            {notificationLogSection.data.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                                  No notification logs found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        {renderLogPagination(notificationLogSection.meta, (page) => setLogPage("notifications", page))}
                      </div>
                    )}

                    {activeLogSubTab === "delivery" && (
                      <div className="space-y-4">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                            <tr>
                              <th className="px-4 py-3">Notification Event</th>
                              <th className="px-4 py-3">Provider / Attempt</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Failure Reason</th>
                              <th className="px-4 py-3">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {deliveryLogSection.data.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-800 dark:text-slate-200">{item.notification?.eventType || "Unknown Event"}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">Channel: {item.notification?.channel || "N/A"}</div>
                                  {item.notification?.recipient && (
                                    <div className="text-xs text-slate-400 mt-0.5">To: {buildUserFullName(item.notification.recipient)}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-700 dark:text-slate-300">{item.provider}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">Attempt #{item.attemptNumber}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge
                                    variant={item.status === "success" ? "default" : "secondary"}
                                    className={item.status === "success" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600 text-white"}
                                  >
                                    {item.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-xs text-red-500 max-w-xs truncate" title={item.failureReason || ""}>
                                  {item.failureReason || <span className="text-slate-400">—</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                            {deliveryLogSection.data.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                                  No delivery logs found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        {renderLogPagination(deliveryLogSection.meta, (page) => setLogPage("delivery", page))}
                      </div>
                    )}

                    {activeLogSubTab === "reminders" && (
                      <div className="space-y-4">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800">
                            <tr>
                              <th className="px-4 py-3">Event Type</th>
                              <th className="px-4 py-3">Associated Task</th>
                              <th className="px-4 py-3">Recipient</th>
                              <th className="px-4 py-3">Sent Time</th>
                              <th className="px-4 py-3">Log Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {reminderLogSection.data.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{item.eventType}</td>
                                <td className="px-4 py-3">
                                  {item.task ? (
                                    <div>
                                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.task.title}</span>
                                      <div className="text-xs text-slate-500">ID: {item.taskId}</div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">Task ID: {item.taskId}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {item.recipient ? (
                                    <div>
                                      <div className="font-medium">{buildUserFullName(item.recipient)}</div>
                                      <div className="text-xs text-slate-500">{item.recipient.email}</div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">ID: {item.recipientId || "None"}</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(item.sentAt).toLocaleString()}</td>
                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                              </tr>
                            ))}
                            {reminderLogSection.data.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-sm text-slate-400">
                                  No reminder logs found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        {renderLogPagination(reminderLogSection.meta, (page) => setLogPage("reminders", page))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <NotificationTemplateBuilderDialog
          open={isTemplateBuilderOpen}
          onOpenChange={(open) => {
            setIsTemplateBuilderOpen(open);
            if (!open) {
              setSelectedTemplate(null);
            }
          }}
          organizationId={organizationId}
          template={selectedTemplate}
          onSaved={loadTemplates}
        />
      </div>
    </Layout>
  );
};

export default NotificationSettingsPage;
