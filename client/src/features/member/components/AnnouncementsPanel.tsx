import { useState } from "react";
import { Pencil, Pin, Plus, Speaker, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useOrganizationContext } from "@/contexts/OrganizationContext";
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useUpdateAnnouncement } from "../hooks/useAnnouncements";
import type { Announcement, AnnouncementPriority } from "../api/announcements";

const PRIORITY_VARIANT: Record<AnnouncementPriority, "secondary" | "default" | "destructive"> = {
  normal: "secondary",
  important: "default",
  urgent: "destructive",
};

function toLocalDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDateTime(value: string): string | undefined {
  return value ? new Date(value).toISOString() : undefined;
}

export default function AnnouncementsPanel() {
  const { activeMembership } = useOrganizationContext();
  const organizationId = activeMembership?.organization_id ?? null;
  const canManage = activeMembership?.role === "super_admin" || activeMembership?.role === "core_committee";
  const { data: announcements = [], isLoading, isError, refetch } = useAnnouncements(organizationId);
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<AnnouncementPriority>("normal");
  const [pinned, setPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setBody("");
    setPriority("normal");
    setPinned(false);
    setExpiresAt("");
    setDialogOpen(true);
  };

  const openEdit = (item: Announcement) => {
    setEditing(item);
    setTitle(item.title);
    setBody(item.body);
    setPriority(item.priority);
    setPinned(item.is_pinned);
    setExpiresAt(toLocalDateTime(item.expires_at));
    setDialogOpen(true);
  };

  const submit = () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle || !cleanBody) return;

    if (editing) {
      updateAnnouncement.mutate(
        {
          id: editing.id,
          title: cleanTitle,
          body: cleanBody,
          priority,
          is_pinned: pinned,
          expires_at: expiresAt ? fromLocalDateTime(expiresAt)! : null,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
      return;
    }

    createAnnouncement.mutate(
      {
        title: cleanTitle,
        body: cleanBody,
        priority,
        is_pinned: pinned,
        expires_at: fromLocalDateTime(expiresAt),
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setTitle("");
          setBody("");
          setPriority("normal");
          setPinned(false);
          setExpiresAt("");
        },
      },
    );
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-1.5"><Speaker className="w-4 h-4" /> Announcements</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Important updates shared with active organization members.</p>
          </div>
          {canManage && <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={openCreate}><Plus className="w-3.5 h-3.5" /> New</Button>}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit announcement" : "Publish announcement"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Title" autoFocus />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={5} placeholder="Message" />
              <div className="grid grid-cols-2 gap-3">
                <Select value={priority} onValueChange={(value) => setPriority(value as AnnouncementPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <Checkbox checked={pinned} onCheckedChange={(checked) => setPinned(checked === true)} />
                Pin this announcement
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button disabled={!title.trim() || !body.trim() || createAnnouncement.isPending || updateAnnouncement.isPending} onClick={submit}>{editing ? "Save changes" : "Publish"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading && <p className="text-sm text-muted-foreground">Loading announcements…</p>}
        {isError && <div className="space-y-2"><p className="text-sm text-muted-foreground">We couldn't load announcements right now.</p><Button size="sm" variant="outline" onClick={() => refetch()}>Try again</Button></div>}
        {!isLoading && !isError && announcements.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
        {!isLoading && !isError && announcements.length > 0 && (
          <div className="space-y-2">
            {announcements.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.is_pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                        <h4 className="font-medium text-foreground break-words">{item.title}</h4>
                        <Badge variant={PRIORITY_VARIANT[item.priority]} className="text-xs capitalize">{item.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{item.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(item.published_at).toLocaleString()}{item.expires_at ? ` · Expires ${new Date(item.expires_at).toLocaleString()}` : ""}</p>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => updateAnnouncement.mutate({ id: item.id, is_pinned: !item.is_pinned })}><Pin className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => { if (window.confirm("Delete this announcement?")) deleteAnnouncement.mutate(item.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
