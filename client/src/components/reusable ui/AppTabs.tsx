import React, { ReactNode, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface TabItem {
  label: string;       
  value: string;     
  content: ReactNode;  
}

interface DynamicTabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export const DynamicTabs: React.FC<DynamicTabsProps> = ({
  tabs,
  defaultValue,
  onValueChange,
}) => {
  const [activeTab, setActiveTab] = useState<string>(defaultValue || tabs[0]?.value);

  const handleChange = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleChange}>
      <TabsList className="mb-2">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="h-10 mr-1 rounded-lg border-1"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};
