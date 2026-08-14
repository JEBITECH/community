// components/ui/TabsContainer.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface TabsContainerProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  tabsListClassName?: string;
  tabTriggerClassName?: string;
  contentClassName?: string;
}

const TabsContainer: React.FC<TabsContainerProps> = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
  tabsListClassName,
  tabTriggerClassName,
  contentClassName,
}) => {
  const [showLeftArrow, setShowLeftArrow] = React.useState(false);
  const [showRightArrow, setShowRightArrow] = React.useState(false);
  const tabsListRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const checkScrollButtons = React.useCallback(() => {
    if (!tabsListRef.current || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    );
  }, []);

  React.useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [checkScrollButtons]);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = 200;
    const newScrollLeft = direction === 'left' 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    
    // Check after scrolling
    setTimeout(checkScrollButtons, 300);
  };

  return (
    <Tabs 
      defaultValue={defaultValue || tabs[0]?.id} 
      value={value}
      onValueChange={onValueChange}
      className={cn("relative", className)}
    >
      <div className="border-b relative">
        {/* Left scroll button */}
        {showLeftArrow && (
          <button
            onClick={() => scrollTabs('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-background to-transparent flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Right scroll button */}
        {showRightArrow && (
          <button
            onClick={() => scrollTabs('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-background to-transparent flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-hide"
          onScroll={checkScrollButtons}
        >
          <TabsList 
            ref={tabsListRef}
            className={cn(
              "h-auto p-0 bg-transparent min-w-max flex-nowrap", 
              tabsListClassName
            )}
          >
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "rounded-none border-b-2 border-transparent px-4 py-3 whitespace-nowrap text-muted-foreground",
                  "hover:text-foreground hover:bg-muted/50 transition-colors",
                  "data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:bg-primary/5 data-[state=active]:shadow-none data-[state=active]:rounded-none",
                  tabTriggerClassName
                )}
              >
                {tab.icon && <span className="mr-2">{tab.icon}</span>}
                <span className="text-sm md:text-base">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>
      
      <div className={cn("overflow-hidden", contentClassName)}>
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};

export default TabsContainer;