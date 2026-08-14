import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, UserCog, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    {
      title: "Add Organization",
      description: "Register a new organization",
      icon: Building,
      onClick: () => navigate("/organizations"),
      bgColor: "bg-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      borderColor: "border-primary/20",
      hoverBg: "hover:bg-primary/10",
      hoverIconBg: "group-hover:bg-primary/20",
    },
    {
      title: "Manage Roles",
      description: "Configure ACL roles and permissions",
      icon: UserCog,
      onClick: () => navigate("/acl-managemnt"),
      bgColor: "bg-success/5",
      iconBg: "bg-success/10",
      iconColor: "text-success",
      borderColor: "border-success/20",
      hoverBg: "hover:bg-success/10",
      hoverIconBg: "group-hover:bg-success/20",
    },
    {
      title: "Invite User",
      description: "Add team member access",
      icon: UserPlus,
      onClick: () => navigate("/users"),
      bgColor: "bg-secondary/5",
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      borderColor: "border-secondary/20",
      hoverBg: "hover:bg-secondary/10",
      hoverIconBg: "group-hover:bg-secondary/20",
    },
  ];

  return (
    <Card className="bg-card border border-border shadow-lg">
      <CardHeader className="bg-muted/50 border-b border-border">
        <CardTitle className="text-lg font-semibold text-card-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <div
              key={index}
              className={`flex items-center p-4 ${action.bgColor} border ${action.borderColor} rounded-lg ${action.hoverBg} hover:shadow-md transition-all duration-200 cursor-pointer group`}
              onClick={action.onClick}
            >
              <div className={`w-10 h-10 ${action.iconBg} rounded-lg flex items-center justify-center mr-4 ${action.hoverIconBg} transition-colors`}>
                <Icon className={`h-5 w-5 ${action.iconColor}`} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{action.title}</h4>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
