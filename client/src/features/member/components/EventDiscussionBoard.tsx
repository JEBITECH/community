import { useMemo, useState } from "react";
import { ArrowLeft, Lock, MessageCircle, Pencil, Pin, Plus, Trash2, Unlock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useCreateDiscussionTopic,
  useDeleteDiscussionTopic,
  useEventDiscussions,
  useModerateDiscussionTopic,
  useUpdateDiscussionTopic,
} from "../hooks/useDiscussions";
import {
  useCreateComment,
  useDeleteComment,
  useEventComments,
  useModerateComment,
  useReportComment,
  useUpdateComment,
} from "../hooks/useComments";
import { DiscussionTopic } from "../api/discussions";
import { CommentThread } from "./CommentThread";

interface Props {
  eventId: string;
  canManage: boolean;
  myMembershipId?: string;
}

export default function EventDiscussionBoard({ eventId, canManage, myMembershipId }: Props) {
  const { data: topics = [], isLoading, isError, refetch } = useEventDiscussions(eventId);
  const createTopic = useCreateDiscussionTopic(eventId);
  const updateTopic = useUpdateDiscussionTopic(eventId);

  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<DiscussionTopic | null>(null);
  const [heading, setHeading] = useState("");
  const [body, setBody] = useState("");

  const activeTopic = topics.find((topic) => topic.id === activeTopicId) ?? null;

  const openCreate = () => {
    setEditingTopic(null);
    setHeading("");
    setBody("");
    setDialogOpen(true);
  };

  const openEdit = (topic: DiscussionTopic) => {
    setEditingTopic(topic);
    setHeading(topic.heading);
    setBody(topic.body ?? "");
    setDialogOpen(true);
  };

  const submitTopic = () => {
    const cleanHeading = heading.trim();
    const cleanBody = body.trim();
    if (!cleanHeading) return;

    if (editingTopic) {
      updateTopic.mutate(
        { id: editingTopic.id, heading: cleanHeading, body: cleanBody || null },
        { onSuccess: () => setDialogOpen(false) },
      );
      return;
    }

    createTopic.mutate(
      { heading: cleanHeading, body: cleanBody || undefined },
      {
        onSuccess: (created) => {
          setDialogOpen(false);
          setHeading("");
          setBody("");
          setActiveTopicId(created.id);
        },
      },
    );
  };

  if (activeTopic) {
    return (
      <TopicThread
        eventId={eventId}
        topic={activeTopic}
        canManage={canManage}
        myMembershipId={myMembershipId}
        onBack={() => setActiveTopicId(null)}
        onEdit={() => openEdit(activeTopic)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4" /> Discussions
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ask questions and keep event-specific conversations together.
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5" /> Start a discussion
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Edit discussion" : "Start a discussion"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Question / topic</label>
              <Input value={heading} onChange={(e) => setHeading(e.target.value)} maxLength={300} autoFocus placeholder="What should everyone know?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Details</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={4} placeholder="Add context (optional)." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={!heading.trim() || createTopic.isPending || updateTopic.isPending} onClick={submitTopic}>
              {editingTopic ? "Save changes" : "Post discussion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoading && <p className="text-sm text-muted-foreground">Loading discussions…</p>}
      {isError && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm text-muted-foreground">We couldn't load discussions right now.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Try again</Button>
          </CardContent>
        </Card>
      )}
      {!isLoading && !isError && topics.length === 0 && (
        <Card>
          <CardContent className="p-5 text-center space-y-1">
            <p className="font-medium text-foreground">No discussions yet</p>
            <p className="text-sm text-muted-foreground">Start with a question or useful note for everyone attending.</p>
          </CardContent>
        </Card>
      )}
      {!isLoading && !isError && topics.length > 0 && (
        <div className="space-y-2">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              role="button"
              tabIndex={0}
              className="cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setActiveTopicId(topic.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTopicId(topic.id);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {topic.is_pinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0" />}
                      <h4 className="font-medium text-foreground break-words">{topic.heading}</h4>
                      {topic.is_closed && (
                        <Badge variant="outline" className="text-xs gap-1"><Lock className="w-3 h-3" /> Closed</Badge>
                      )}
                    </div>
                    {topic.body && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{topic.body}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Started by {topic.author_name}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 gap-1">
                    <MessageCircle className="w-3 h-3" /> {topic.comment_count}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TopicThread({ eventId, topic, canManage, myMembershipId, onBack, onEdit }: {
  eventId: string;
  topic: DiscussionTopic;
  canManage: boolean;
  myMembershipId?: string;
  onBack: () => void;
  onEdit: () => void;
}) {
  const { data: comments = [], isLoading, isError } = useEventComments(eventId, topic.id);
  const createComment = useCreateComment(eventId, topic.id);
  const updateComment = useUpdateComment(eventId, topic.id);
  const deleteComment = useDeleteComment(eventId, topic.id);
  const reportComment = useReportComment(eventId, topic.id);
  const moderateComment = useModerateComment(eventId, topic.id);
  const moderateTopic = useModerateDiscussionTopic(eventId);
  const deleteTopic = useDeleteDiscussionTopic(eventId);
  const [newComment, setNewComment] = useState("");

  const topLevelComments = useMemo(
    () => comments.filter((comment) => !comment.parent_comment_id),
    [comments],
  );

  const postComment = () => {
    const body = newComment.trim();
    if (!body) return;
    createComment.mutate({ body }, { onSuccess: () => setNewComment("") });
  };

  const removeTopic = () => {
    if (!window.confirm("Delete this discussion? Its comments will also be removed.")) return;
    deleteTopic.mutate(topic.id, { onSuccess: onBack });
  };

  return (
    <div className="space-y-3">
      <button type="button" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={onBack}>
        <ArrowLeft className="w-3.5 h-3.5" /> All discussions
      </button>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {topic.is_pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                <h3 className="font-semibold text-foreground break-words">{topic.heading}</h3>
                {topic.is_closed && <Badge variant="outline">Closed</Badge>}
              </div>
              {topic.body && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{topic.body}</p>}
              <p className="text-xs text-muted-foreground mt-2">Started by {topic.author_name}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(canManage || topic.membership_id === myMembershipId) && (
                <Button size="sm" variant="ghost" onClick={onEdit} title="Edit discussion">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {canManage && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => moderateTopic.mutate({ id: topic.id, is_pinned: !topic.is_pinned })} title={topic.is_pinned ? "Unpin" : "Pin"}>
                    <Pin className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => moderateTopic.mutate({ id: topic.id, is_closed: !topic.is_closed })} title={topic.is_closed ? "Reopen" : "Close"}>
                    {topic.is_closed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={removeTopic} title="Delete discussion">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {topic.is_closed ? (
        <p className="text-xs text-muted-foreground">This discussion is closed to new comments.</p>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-2">
            <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} maxLength={2000} rows={3} placeholder="Add your comment..." />
            <div className="flex justify-end">
              <Button size="sm" shape="pill" disabled={!newComment.trim() || createComment.isPending} onClick={postComment}>Post comment</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading comments…</p>}
      {isError && <p className="text-sm text-destructive">We couldn't load comments for this discussion.</p>}
      {!isLoading && !isError && topLevelComments.length === 0 && (
        <Card><CardContent className="p-5 text-center text-sm text-muted-foreground">No comments yet. Start the conversation.</CardContent></Card>
      )}
      {!isLoading && !isError && topLevelComments.map((comment) => (
        <CommentThread
          key={comment.id}
          comment={comment}
          replies={comments.filter((reply) => reply.parent_comment_id === comment.id)}
          canManage={canManage}
          myMembershipId={myMembershipId}
          allowReply={!topic.is_closed}
          onUpdate={(id, body) => updateComment.mutate({ id, body })}
          onDelete={(id) => { if (window.confirm("Delete this comment?")) deleteComment.mutate(id); }}
          onReport={(id) => reportComment.mutate(id)}
          onModerate={(id, status) => moderateComment.mutate({ id, status })}
          onReply={(body, parentId) => createComment.mutate({ body, parent_comment_id: parentId })}
        />
      ))}
    </div>
  );
}
