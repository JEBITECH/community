import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemStatus() {
  const services = [
    { name: "Import Service", status: "Online", healthy: true },
    { name: "Auth Service", status: "Online", healthy: true },
    { name: "Database", status: "High Load", healthy: false },
    { name: "Redis Cache", status: "Online", healthy: true },
  ];

  return (
    <Card className="bg-card border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground">System Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {services.map((service, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className={`w-2 h-2 rounded-full ${
                  service.healthy ? 'bg-secondary' : 'bg-warning animate-pulse'
                }`}
              />
              <span className="text-sm font-medium text-foreground">{service.name}</span>
            </div>
            <span 
              className={`text-xs ${
                service.healthy ? 'text-muted-foreground' : 'text-warning'
              }`}
            >
              {service.status}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
