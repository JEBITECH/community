"use client";

import { useState } from "react";
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
    <ModalHost>
      <div className="deco-strip" />
      <Topbar />
      <Hero onNavigate={navigate} />
      <TabNav active={tab} onChange={navigate} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px" }}>
        {tab === "events" && <EventsTab />}
        {tab === "my-activity" && <MyActivityTab />}
        {tab === "community" && <CommunityTab />}
      </div>
    </ModalHost>
  );
}
