import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getChatHistory, getChatConfig, ChatMessage } from "../api/chat";

const CHAT_WS_URL = import.meta.env.VITE_COMMUNITY_WS_URL || "http://localhost:5021";

export const useChatConfig = (eventId?: string) =>
  useQuery({ queryKey: ["chat-config", eventId], queryFn: () => getChatConfig(eventId!), enabled: !!eventId });

/** Live chat: REST fetches the initial page of history, then a direct
 * Socket.io connection to community-svc (not proxied through the gateway —
 * WS upgrades don't traverse the REST reverse proxy cleanly) streams new
 * messages into the same list. */
export function useEventChat(eventId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useQuery({
    queryKey: ["chat-history", eventId],
    queryFn: () => getChatHistory(eventId!),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  useEffect(() => {
    if (!eventId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(`${CHAT_WS_URL}/community/chat`, { auth: { token }, transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join", { event_id: eventId });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("chat_error", (payload: { message: string }) => setError(payload.message));
    socket.on("message", (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [eventId]);

  const sendMessage = useCallback((body: string) => {
    if (!eventId || !socketRef.current) return;
    socketRef.current.emit("message", { event_id: eventId, body });
  }, [eventId]);

  const refetchHistory = useCallback(() => {
    if (eventId) queryClient.invalidateQueries({ queryKey: ["chat-history", eventId] });
  }, [eventId, queryClient]);

  return { messages, connected, error, sendMessage, isLoading, refetchHistory };
}
