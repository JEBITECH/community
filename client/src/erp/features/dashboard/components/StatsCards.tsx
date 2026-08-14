import { Card, CardContent } from "@/components/ui/card";
import { Download, Plug, Database, Activity, TrendingUp, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const cards = [
    {
      title: "Active Imports",
      value: (stats as any)?.activeImports || 0,
      change: "+12% from yesterday",
      icon: Download,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      changePositive: true,
    },
    {
      title: "PMS Connected",
      value: (stats as any)?.connectedPMS || 0,
      change: "All systems online",
      icon: Plug,
      iconBg: "bg-success/10",
      iconColor: "text-success",
      changePositive: true,
    },
    {
      title: "Records Processed",
      value: (stats as any)?.recordsProcessed ? `${((stats as any).recordsProcessed / 1000000).toFixed(1)}M` : "0",
      change: "+8.2% this week",
      icon: Database,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      changePositive: true,
    },
    {
      title: "System Health",
      value: `${(stats as any)?.systemHealth || 0}%`,
      change: "Excellent",
      icon: Activity,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      changePositive: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/50 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className={cn(
              "group relative overflow-hidden border-border/50 bg-background backdrop-blur-sm",
              "hover:shadow-medium hover:scale-[1.02] hover:border-border/80 transition-all duration-300 cursor-pointer",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
            )}
          >
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between relative">
                <div className="flex-1 space-y-3">
                  <p className="text-ui-caption text-muted-foreground font-medium uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className="text-data-metric text-foreground group-hover:scale-105 transition-all duration-200">
                    {card.value}
                  </p>
                  <div className={cn(
                    "flex items-center text-ui-caption font-medium",
                    card.changePositive ? 'text-success' : 'text-destructive'
                  )}>
                    {card.changePositive && <TrendingUp className="w-3 h-3 mr-1.5" />}
                    {card.change}
                  </div>
                </div>
                
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                  card.iconBg,
                  "group-hover:scale-110 group-hover:rotate-3"
                )}>
                  <Icon className={cn(card.iconColor, "transition-colors duration-300")} size={20} />
                </div>
              </div>
              

            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
