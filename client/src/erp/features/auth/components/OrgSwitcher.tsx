import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Clock, Plus } from "lucide-react";
import { useOrganizationContext } from "@/contexts/OrganizationContext";

export default function OrgSwitcher() {
  const navigate = useNavigate();
  const { memberships, activeMembership, setSelectedOrganizationId, isLoadingOrganizations } = useOrganizationContext();

  return (
    <div className="flex justify-center items-center min-h-screen bg-background py-8">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Your Communities</h2>
            <p className="text-sm text-muted-foreground">One account, many communities. Pick one to continue.</p>
          </div>

          {isLoadingOrganizations ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">You haven't joined any community yet.</p>
          ) : (
            <div className="space-y-2">
              {memberships.map((m) => {
                const isActive = m.status === "active";
                const isCurrent = activeMembership?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={!isActive}
                    onClick={() => {
                      setSelectedOrganizationId(m.organization_id);
                      navigate("/");
                    }}
                    className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isCurrent ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    } ${!isActive ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 shrink-0">
                      <Building2 className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{m.organization.organization_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {m.role.replace("_", " ")}
                        {m.member_type === "external" ? " · external" : ""}
                      </p>
                    </div>
                    {!isActive ? (
                      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                        <Clock className="w-3 h-3" /> {m.status}
                      </Badge>
                    ) : isCurrent ? (
                      <Badge>Current</Badge>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/join")}>
            <Plus className="w-4 h-4" /> Join Another Community
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
