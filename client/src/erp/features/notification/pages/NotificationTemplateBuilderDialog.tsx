import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Eye, Languages, Send, X, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  EmailBuilderProvider,
  useEmailBuilder,
  EmailBuilderDndWrapper,
  EmailBuilderSidebar,
  EmailBuilderCanvas,
  EmailBuilderProperties,
  EmailBuilderToolbar,
  DEFAULT_CATEGORIES,
  generateEmailHtml,
} from "@/erp/features/notification/components/email-builder";
import type { EmailElement } from "@/erp/features/notification/components/email-builder";
import { VARIABLE_KEY_ALIASES, type VariableItem } from "@/erp/features/notification/components/email-builder/VariablePicker";
import type { NotificationTemplatePayload } from "@/erp/features/notification/api";
import {
  createNotificationTemplate,
  previewNotificationTemplate,
  updateNotificationTemplate,
  testNotificationTemplate,
} from "@/erp/features/notification/api";
import { ModuleAccess } from "@/erp/features/auth/type";

export type NotificationTemplateRecord = Omit<NotificationTemplatePayload, "variables"> & {
  id: number;
  variables?: string[] | Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
};

interface NotificationTemplateBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: number;
  template?: NotificationTemplateRecord | null;
  onSaved?: () => Promise<void> | void;
}

type TemplateDraft = {
  name: string;
  description: string;
  eventType: string;
  channel: string;
  language: string;
  category: string;
  type: string;
  status: string;
  subject: string;
  preheader: string;
  version: number;
  fallbackTemplateId: string;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  updatedBy: string;
};

const defaultDraft = (): TemplateDraft => ({
  name: "",
  description: "",
  eventType: "virtual-inspect.task.created",
  channel: "email",
  language: "en",
  category: "transactional",
  type: "virtual-inspect.task.created",
  status: "draft",
  subject: "New Inspection Task Created",
  preheader: "",
  version: 1,
  fallbackTemplateId: "",
  isActive: true,
  isDefault: false,
  createdBy: "",
  updatedBy: "",
});

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-950";

const textareaClass =
  "min-h-[110px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary dark:border-slate-700 dark:bg-slate-950";

const VARIABLE_EXAMPLE_MAP = DEFAULT_CATEGORIES.reduce<Record<string, string>>((acc, category) => {
  category.variables.forEach((variable) => {
    acc[variable.key] = variable.example;
  });
  return acc;
}, {});

const DEFAULT_PREVIEW_VARIABLES = {
  firstName: "Alex",
  task_title: "Inspection Follow-up",
  property_name: "Palm Villa",
};

const VARIABLE_TOKEN_REGEX = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

const parseElements = (template?: NotificationTemplateRecord | null): EmailElement[] | null => {
  if (!template?.jsonContent) return null;
  try {
    const parsed = JSON.parse(template.jsonContent);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as EmailElement[];
    }
  } catch {
    return null;
  }
  return null;
};

const parseVariables = (value: string) => {
  try {
    const parsed = JSON.parse(value || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("Variables must be a JSON object.");
  } catch {
    throw new Error("Variables must be valid JSON.");
  }
};

const formatVariables = (value: Record<string, unknown>) => JSON.stringify(value, null, 2);

const safeParseVariables = (value: string) => {
  try {
    return parseVariables(value);
  } catch {
    return {};
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const response = error as {
      response?: { data?: { message?: string | string[]; error?: string } };
      message?: string;
    };
    const responseMessage = response.response?.data?.message;
    if (Array.isArray(responseMessage) && responseMessage.length > 0) {
      return responseMessage.join(", ");
    }
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }
    if (typeof response.response?.data?.error === "string" && response.response.data.error.trim()) {
      return response.response.data.error;
    }
    if (typeof response.message === "string" && response.message.trim()) {
      return response.message;
    }
  }

  return fallback;
};

const getTemplateVariableKeys = (value?: NotificationTemplateRecord["variables"]) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (value && typeof value === "object") {
    return Object.keys(value).filter((key) => key.trim().length > 0);
  }

  return [];
};

const extractVariableKeys = (template?: NotificationTemplateRecord | null) => {
  const source = [template?.template, template?.htmlContent, template?.textContent, template?.jsonContent, template?.subject]
    .filter((part): part is string => Boolean(part))
    .join("\n");

  return Array.from(new Set(Array.from(source.matchAll(VARIABLE_TOKEN_REGEX), (match) => match[1])));
};

const buildPreviewVariables = (template?: NotificationTemplateRecord | null) => {
  const storedVariables = getTemplateVariableKeys(template?.variables);
  const inferredVariables = extractVariableKeys(template);
  const keys = Array.from(new Set([...storedVariables, ...inferredVariables]));

  if (keys.length === 0) {
    return { ...DEFAULT_PREVIEW_VARIABLES };
  }

  return keys.reduce<Record<string, unknown>>((acc, key) => {
    const exampleKey = VARIABLE_KEY_ALIASES[key] ?? key;
    acc[key] = VARIABLE_EXAMPLE_MAP[exampleKey] ?? "";
    return acc;
  }, {});
};

const buildPlainText = (elements: EmailElement[]) =>
  elements
    .map((element) => {
      if (element.type === "image") return element.properties?.alt || element.content || "";
      return element.content || "";
    })
    .filter(Boolean)
    .join("\n\n");

function NotificationTemplateBuilderInner({ open, onOpenChange, organizationId, template, onSaved }: NotificationTemplateBuilderDialogProps) {
  const { elements, setAllElements, templateSettings, updateTemplateSettings } = useEmailBuilder();
  const { toast } = useToast();
  const [draft, setDraft] = useState<TemplateDraft>(defaultDraft());
  const [initialized, setInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVariablesJson, setPreviewVariablesJson] = useState(() => formatVariables(buildPreviewVariables(template)));
  const [preview, setPreview] = useState<{ subject: string | null; body: string } | null>(null);
  const [persistedTemplateId, setPersistedTemplateId] = useState<number | null>(template?.id ?? null);

  const templateId = persistedTemplateId ?? template?.id ?? null;
  const selectedModules: ModuleAccess[] = JSON.parse(localStorage.getItem("modules") || "[]");
  console.log("=========selectedModules=======", selectedModules);

  useEffect(() => {
    if (!open) {
      setInitialized(false);
      setPreview(null);
      setPersistedTemplateId(template?.id ?? null);
      setPreviewVariablesJson(formatVariables(buildPreviewVariables(template)));
      return;
    }

    const loadedElements = parseElements(template);
    const fallbackContent = template?.textContent ?? template?.template ?? template?.htmlContent ?? "";

    if (!initialized) {
      if (loadedElements) {
        setAllElements(loadedElements);
      } else if (template || fallbackContent) {
        setAllElements([
          {
            id: `legacy-${Date.now()}`,
            type: "text",
            content: fallbackContent || "Template body goes here.",
            styles: {
              fontSize: "16px",
              lineHeight: "1.6",
              color: "#333333",
              fontFamily: "Arial, sans-serif",
              padding: "10px 20px",
            },
          },
        ]);
      } else {
        setAllElements([]);
      }

      const nextDraft = {
        ...defaultDraft(),
        name: template?.name ?? "",
        description: template?.description ?? "",
        eventType: template?.eventType ?? "virtual-inspect.task.created",
        channel: template?.channel ?? "email",
        language: template?.language ?? "en",
        category: template?.category ?? "transactional",
        type: template?.type ?? template?.eventType ?? "virtual-inspect.task.created",
        status: template?.status ?? "draft",
        subject: template?.subject ?? "New Inspection Task Created",
        preheader: template?.preheader ?? "",
        version: template?.version ?? 1,
        fallbackTemplateId: template?.fallbackTemplateId ? String(template.fallbackTemplateId) : "",
        isActive: template?.isActive ?? true,
        isDefault: template?.isDefault ?? false,
        createdBy: template?.createdBy ?? "",
        updatedBy: template?.updatedBy ?? "",
      };
      setDraft(nextDraft);
      setPersistedTemplateId(template?.id ?? null);
      setPreviewVariablesJson(formatVariables(buildPreviewVariables(template)));
      updateTemplateSettings({
        name: nextDraft.name,
        subject: nextDraft.subject,
        category: nextDraft.category,
        type: nextDraft.type,
        preheader: nextDraft.preheader,
      });
      setInitialized(true);
    }
  }, [open, template, initialized, organizationId, setAllElements, updateTemplateSettings]);

  useEffect(() => {
    if (!open) return;

    setInitialized(false);
    setPreview(null);
    setPersistedTemplateId(template?.id ?? null);
    setPreviewVariablesJson(formatVariables(buildPreviewVariables(template)));
  }, [open, template?.id]);

  useEffect(() => {
    if (!initialized) return;
    updateTemplateSettings({
      name: draft.name,
      subject: draft.subject,
      category: draft.category,
      type: draft.type,
      preheader: draft.preheader,
    });
  }, [draft.name, draft.subject, draft.category, draft.type, draft.preheader, initialized, updateTemplateSettings]);

  const isEditing = Boolean(templateId);
  const currentTemplateName = draft.name || draft.subject || "Untitled template";
  const activeTemplateSettings = {
    ...templateSettings,
    name: draft.name,
    subject: draft.subject,
    category: draft.category,
    type: draft.type,
    preheader: draft.preheader,
  };

  const handleVariableInsert = (variable: VariableItem) => {
    setPreviewVariablesJson((current) => {
      const nextVariables = safeParseVariables(current);
      if (nextVariables[variable.key] === undefined || nextVariables[variable.key] === null || nextVariables[variable.key] === "") {
        nextVariables[variable.key] = variable.example;
      }
      return formatVariables(nextVariables);
    });
  };

  const saveTemplate = async (shouldClose: boolean) => {
    setIsSaving(true);
    try {
      const htmlContent = generateEmailHtml(elements, activeTemplateSettings);
      const textContent = buildPlainText(elements);
      const jsonContent = JSON.stringify(elements);
      const previewVariables = parseVariables(previewVariablesJson);
      const payload: NotificationTemplatePayload = {
        name: draft.name || currentTemplateName,
        description: draft.description || null,
        eventType: draft.eventType,
        channel: draft.channel,
        language: draft.language,
        organizationId: organizationId ?? null,
        category: draft.category,
        type: draft.type,
        htmlContent,
        textContent,
        jsonContent,
        variables: Object.keys(previewVariables).filter((key) => key.trim().length > 0),
        preheader: draft.preheader || null,
        subject: draft.subject || null,
        template: htmlContent,
        status: draft.status,
        isDefault: draft.isDefault,
        version: draft.version,
        isActive: draft.isActive,
        fallbackTemplateId: draft.fallbackTemplateId ? Number(draft.fallbackTemplateId) : null,
        createdBy: draft.createdBy || null,
        updatedBy: draft.updatedBy || null,
      };

      if (isEditing && templateId) {
        await updateNotificationTemplate(templateId, payload);
      } else {
        const created = await createNotificationTemplate(payload);
        if (created?.id && typeof created.id === "number") {
          setPersistedTemplateId(created.id);
        }
      }

      await onSaved?.();
      toast({
        title: "Success",
        description: "Notification template saved successfully.",
      });

      if (shouldClose) {
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: getErrorMessage(error, "Unable to save notification template."),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    try {
      const htmlContent = generateEmailHtml(elements, activeTemplateSettings);
      const rendered = await previewNotificationTemplate({
        subject: draft.subject,
        template: htmlContent,
        variables: parseVariables(previewVariablesJson),
      });
      setPreview(rendered);
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: getErrorMessage(error, "Unable to render preview."),
        variant: "destructive",
      });
    }
  };

  const handleTest = async () => {
    if (isEditing && templateId) {
      try {
        const result = await testNotificationTemplate(templateId, parseVariables(previewVariablesJson));
        setPreview(result.rendered);
      } catch (error: any) {
        toast({
          title: "Test failed",
          description: getErrorMessage(error, "Unable to test template."),
          variant: "destructive",
        });
      }
      return;
    }

    await handlePreview();
  };

  const rightPanelSummary = useMemo(
    () => [
      { label: "Channel", value: draft.channel },
      { label: "Language", value: draft.language },
      { label: "Version", value: `v${draft.version}` },
      { label: "Status", value: draft.status },
    ],
    [draft.channel, draft.language, draft.status, draft.version],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="grid flex-1 gap-4 overflow-hidden px-6 pb-4 lg:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <EmailBuilderToolbar
            onSaveDraft={() => saveTemplate(false)}
            onSaveAndExit={() => saveTemplate(true)}
            isSaving={isSaving}
            showPreview={showPreview}
            onTogglePreview={() => setShowPreview((prev) => !prev)}
            saveAndExitLabel="Save & Close"
            onVariableInsert={handleVariableInsert}
          />

          <div className="min-h-0 flex-1 overflow-hidden">
            <EmailBuilderDndWrapper>
              <div className="flex h-full min-h-0 overflow-hidden">
                {!showPreview && (
                  <div className="w-[280px] min-w-[280px] overflow-auto border-r border-slate-200 dark:border-slate-700">
                    <EmailBuilderSidebar />
                  </div>
                )}

                <div className="flex-1 overflow-auto bg-muted/40">
                  <EmailBuilderCanvas showPreview={showPreview} />
                </div>

                {!showPreview && (
                  <div className="w-[300px] min-w-[300px] overflow-auto border-l border-slate-200 dark:border-slate-700">
                    <EmailBuilderProperties />
                  </div>
                )}
              </div>
            </EmailBuilderDndWrapper>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-4 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Template Details</h3>
              <Badge variant={draft.isActive ? "default" : "secondary"}>{draft.isActive ? "Active" : "Inactive"}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Keep the event routing metadata in sync with the template body.</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols gap-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                  className={inputClass}
                  placeholder="Friendly template name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                {selectedModules && Array.isArray(selectedModules) && selectedModules.length > 1 && (
                  <select value={draft.type} onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))} className={inputClass}>
                    {selectedModules.map((module, idx) => (
                      <option key={idx} value={module.name}>
                        {module.name}
                      </option>
                    ))}
                  </select>
                )}
                {selectedModules && selectedModules.length === 0 && (
                  <select value={draft.type} onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))} className={inputClass}>
                    <option value="">No module is selected</option>
                  </select>
                )}
              </div>
              {/* <div className="space-y-2">
                <Label>Type</Label>
                <input value={draft.type} onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value }))} className={inputClass} />
              </div> */}

              <div className="space-y-2">
                <Label>Event Type</Label>
                <select value={draft.eventType} onChange={(event) => setDraft((prev) => ({ ...prev, eventType: event.target.value }))} className={inputClass}>
                  <option value="task.created">Task Created</option>
                  <option value="task.updated">Task Updated</option>
                  <option value="task.assigned">Task Assigned</option>
                  <option value="task.inspection.completed">Task Inspection Completed</option>
                  <option value="task.completed">Task Completed</option>
                  <option value="task.upcoming.24h">Task Upcoming (24h)</option>
                  <option value="task.upcoming.1h">Task Upcoming (1h)</option>
                  <option value="task.upcoming.15m">Task Upcoming (15m)</option>
                  <option value="task.overdue">Task Overdue</option>
                  <option value="reservation.created">Reservation Created</option>
                  <option value="reservation.confirmed">Reservation Confirmed</option>
                  <option value="reservation.cancelled">Reservation Cancelled</option>
                  <option value="form.submitted">Form Submitted</option>
                </select>
              </div>

              {/* <div className="space-y-2">
                <Label>Event Type</Label>
                <input
                  value={draft.eventType}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      eventType: event.target.value,
                      type: prev.type || event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div> */}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Language</Label>
                <input value={draft.language} onChange={(event) => setDraft((prev) => ({ ...prev, language: event.target.value }))} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <input value={draft.category} onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Channel</Label>
                <select value={draft.channel} onChange={(event) => setDraft((prev) => ({ ...prev, channel: event.target.value }))} className={inputClass}>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="in_app">In App</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={draft.status} onChange={(event) => setDraft((prev) => ({ ...prev, status: event.target.value }))} className={inputClass}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Version</Label>
                <input
                  type="number"
                  min={1}
                  value={draft.version}
                  onChange={(event) => setDraft((prev) => ({ ...prev, version: Number(event.target.value) || 1 }))}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label>Fallback Template ID</Label>
                <input
                  value={draft.fallbackTemplateId}
                  onChange={(event) => setDraft((prev) => ({ ...prev, fallbackTemplateId: event.target.value }))}
                  className={inputClass}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <input value={draft.subject} onChange={(event) => setDraft((prev) => ({ ...prev, subject: event.target.value }))} className={inputClass} />
            </div>

            <div className="space-y-2">
              <Label>Preheader</Label>
              <input value={draft.preheader} onChange={(event) => setDraft((prev) => ({ ...prev, preheader: event.target.value }))} className={inputClass} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                value={draft.description}
                onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                className={textareaClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <span className="text-sm font-medium">Active</span>
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))}
                  className="h-4 w-4"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                <span className="text-sm font-medium">Default</span>
                <input
                  type="checkbox"
                  checked={draft.isDefault}
                  onChange={(event) => setDraft((prev) => ({ ...prev, isDefault: event.target.checked }))}
                  className="h-4 w-4"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Preview Variables</h3>
              <Button type="button" size="sm" variant="outline" onClick={handlePreview}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </div>
            <textarea value={previewVariablesJson} onChange={(event) => setPreviewVariablesJson(event.target.value)} className={textareaClass} />
            <div className="flex gap-2">
              <Button type="button" onClick={handleTest} className="flex-1">
                <Send className="mr-2 h-4 w-4" />
                {isEditing ? "Test Template" : "Preview Render"}
              </Button>
              <Button type="button" variant="outline" onClick={() => saveTemplate(false)} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </div>

          {preview && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Languages className="h-4 w-4" />
                  Rendered Preview
                </div>
                {preview.subject && (
                  <p className="text-sm">
                    <strong>Subject:</strong> {preview.subject}
                  </p>
                )}
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-950">
                  {preview.body}
                </pre>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Summary</span>
              <Badge variant="outline">{elements.length} block(s)</Badge>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              {rightPanelSummary.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 dark:bg-slate-900">
                  <span>{item.label}</span>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Builder content saves to both the structured JSON layout and the HTML payload.
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-6 py-3 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{currentTemplateName}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationTemplateBuilderDialog(props: NotificationTemplateBuilderDialogProps) {
  const key = `${props.open ? "open" : "closed"}-${props.template?.id ?? "new"}`;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[92vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Notification Template Builder</DialogTitle>
          <DialogDescription>
            Design the notification body with the shared email builder, then save the routing details alongside the content.
          </DialogDescription>
        </DialogHeader>

        <EmailBuilderProvider key={key}>
          <NotificationTemplateBuilderInner {...props} />
        </EmailBuilderProvider>
      </DialogContent>
    </Dialog>
  );
}
