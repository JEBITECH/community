import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Check, Plug } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function RecentActivity() {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <User className="text-primary" size={12} />;
      case 'import_complete':
        return <Check className="text-secondary" size={12} />;
      case 'update':
        return <Plug className="text-warning" size={12} />;
      default:
        return <User className="text-muted-foreground" size={12} />;
    }
  };

  const getActivityMessage = (log: any) => {
    switch (log.action) {
      case 'create':
        return `${log.user?.firstName || 'User'} created new ${log.resource.replace('_', ' ')}`;
      case 'import_complete':
        return `Import job #${log.resourceId?.slice(-4)} completed successfully`;
      case 'update':
        return `${log.resource.charAt(0).toUpperCase()}${log.resource.slice(1).replace('_', ' ')} was updated`;
      default:
        return `${log.action} on ${log.resource}`;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-card-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-start space-x-3">
              <div className="w-6 h-6 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2 mt-1"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(!auditLogs || !Array.isArray(auditLogs) || auditLogs.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          auditLogs.map((log: any) => (
            <div key={log.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className={`w-6 h-6 ${log.action === 'create' ? 'bg-primary' : log.action === 'import_complete' ? 'bg-secondary' : 'bg-warning'} bg-opacity-10 rounded-full flex items-center justify-center`}>
                  {getActivityIcon(log.action)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{getActivityMessage(log)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.createdAt))} ago
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
