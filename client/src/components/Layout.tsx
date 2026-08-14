import Header from "./Header";
import Sidebar from "./Sidebar";
import React, { useEffect } from "react";

import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "../utils/firebase";
import { useUpdateFCMToken } from "@/erp/features/user-management";
import { useAuth } from "@/hooks/useAuth";
// @ts-ignore: zustand-store is a JS module without declaration file
import { getState, setState } from "@/erp/context/zustand-store";

interface LayoutProps {
  children: React.ReactNode;
  onNewImport?: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function Layout({ children, onNewImport = () => { }, title, subtitle, icon }: LayoutProps) {
  const updateFCMTokenMutation = useUpdateFCMToken();
  const { user } = useAuth();

  // Lock document scroll while this Layout is mounted so only <main> scrolls.
  // Pages that don't use Layout (login, landing, etc.) are unaffected.
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        console.log("Notification permission denied");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: "BFHyKtxvC_uHG0Bop96Hkx5ixt4rPtEeXNG41OuORnoW9m6hsgpkDbIsFwSlmjUJlYtpwq8XHOh7o-CpDuVR-v0",
      });

      updateFCMTokenMutation.mutate({ data: { fcm_token: token } });

      return token;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const unsubscribe = onMessage(messaging, (payload) => {
      if (!user || payload.data?.user_id !== user.id) {
        return;
      }

      const notifications = getState().notifications;
      setState({
        notifications: [
          {
            ...payload.data,
            roomInfo: payload.data,
            read: false,
            newCall: true,
            foregroundCall: true,
          },
          ...notifications,
        ],
      });

      //toast.success(payload.notification.title);
    });

    return unsubscribe;
  }, [user]);

  return (
    <div className="flex h-screen overflow-hidden font-inter bg-background theme-transition">
      {/* Sidebar - Fixed */}
      <div className="flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area - Scrollable */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header - Sticky within the scrollable area */}
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border shadow-sm flex-shrink-0">
          <Header onNewImport={onNewImport} title={title} subtitle={subtitle} icon={icon} />
        </header>

        {/* Page content - Scrollable only when needed */}
        <main className="flex-1 min-h-0 overflow-auto bg-background text-foreground theme-transition">
          {children}
        </main>
      </div>
    </div>
  );
}