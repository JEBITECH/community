import { useEffect, useState } from "react";
import { Eye, EyeOff, Flag, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EventComment } from "../api/comments";

export interface CommentThreadProps {
  comment: EventComment;
  replies: EventComment[];
  canManage: boolean;
  myMembershipId?: string;
  allowReply?: boolean;
  onUpdate: (id: string, body: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  onModerate: (id: string, status: "visible" | "hidden") => void;
  onReply: (body: string, parentId: string) => void;
}

export function CommentItem({
  comment,
  canManage,
  myMembershipId,
  allowReply = false,
  onUpdate,
  onDelete,
  onReport,
  onModerate,
  onReply,
}: Omit<CommentThreadProps, "replies">) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => setEditBody(comment.body), [comment.body]);

  const isOwner = comment.membership_id === myMembershipId;
  const isHidden = comment.moderation_status === "hidden";

  return (
    <div className={`text-sm ${isHidden ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-foreground">{comment.author_name}</span>
        {comment.moderation_status === "reported" && canManage && (
          <Badge variant="outline" className="text-xs text-destructive border-destructive/30">Reported</Badge>
        )}
        {isHidden && <Badge variant="outline" className="text-xs">Hidden</Badge>}
      </div>

      {editing ? (
        <div className="mt-2 space-y-2">
          <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} maxLength={2000} rows={3} autoFocus />
          <div className="flex gap-2">
            <Button size="sm" shape="pill" disabled={!editBody.trim()} onClick={() => { onUpdate(comment.id, editBody.trim()); setEditing(false); }}>
              Save
            </Button>
            <Button size="sm" shape="pill" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground mt-1 whitespace-pre-wrap break-words">{comment.body}</p>
      )}

      {!editing && (
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
          {allowReply && (
            <button type="button" className="hover:text-foreground" onClick={() => setReplying((value) => !value)}>
              {replying ? "Cancel reply" : "Reply"}
            </button>
          )}
          {isOwner && (
            <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => setEditing(true)}>
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
          {(isOwner || canManage) && (
            <button type="button" className="flex items-center gap-1 hover:text-destructive" onClick={() => onDelete(comment.id)}>
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
          {!isOwner && !isHidden && (
            <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => onReport(comment.id)}>
              <Flag className="w-3 h-3" /> Report
            </button>
          )}
          {canManage && (
            <button type="button" className="flex items-center gap-1 hover:text-foreground" onClick={() => onModerate(comment.id, isHidden ? "visible" : "hidden")}>
              {isHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {isHidden ? "Unhide" : "Hide"}
            </button>
          )}
        </div>
      )}

      {replying && allowReply && (
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <Textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply..." maxLength={2000} rows={2} />
          <Button size="sm" shape="pill" disabled={!replyBody.trim()} onClick={() => { onReply(replyBody.trim(), comment.id); setReplyBody(""); setReplying(false); }}>
            Reply
          </Button>
        </div>
      )}
    </div>
  );
}

export function CommentThread({ comment, replies, allowReply = true, ...props }: CommentThreadProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <CommentItem comment={comment} allowReply={allowReply} {...props} />
        {replies.length > 0 && (
          <div className="pl-4 border-l-2 border-border space-y-3">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} allowReply={false} {...props} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
