"use client";

import { useState } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { ModalHost } from "@/components/ModalHost";
import { Topbar } from "@/components/Topbar";
import { Hero } from "@/components/Hero";
import { TabNav, type TabId } from "@/components/TabNav";
import { EventsTab } from "@/components/tabs/EventsTab";
import { MyActivityTab } from "@/components/tabs/MyActivityTab";
import { CommunityTab } from "@/components/tabs/CommunityTab";

export default function Home() {
  const [tab, setTab] = useState<TabId>("events");

  const navigate = (next: TabId) => {
    setTab(next);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <AuthGate>
      <ModalHost>
        <div className="deco-strip" />
        <Topbar />
        <Hero onNavigate={navigate} />
        <TabNav active={tab} onChange={navigate} />

        <main id="main" className="u-container u-page-pad">
          {tab === "events" && <EventsTab />}
          {tab === "my-activity" && <MyActivityTab />}
          {tab === "community" && <CommunityTab />}
        </main>
      </ModalHost>
    </AuthGate>
  );
}
