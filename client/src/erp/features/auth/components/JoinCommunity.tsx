import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2, Clock, Search } from "lucide-react";
import { getOrganizationBySubdomain } from "../api";
import { useJoinCommunityMutation } from "../hooks/useAuthMutation";
import { OrganizationPreview } from "../type";

export default function JoinCommunity() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [joinMode, setJoinMode] = useState<"subdomain" | "invite">("subdomain");
  const [subdomain, setSubdomain] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [foundOrg, setFoundOrg] = useState<OrganizationPreview | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [unitIdentifier, setUnitIdentifier] = useState("");
  const [pendingResult, setPendingResult] = useState<string | null>(null);

  const lookupMutation = useMutation({
    mutationFn: (value: string) => getOrganizationBySubdomain(value.trim()),
    onSuccess: (org) => setFoundOrg(org),
    onError: () => setFoundOrg(null),
  });

  const joinMutation = useJoinCommunityMutation();

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Card className="w-full max-w-md shadow-lg rounded-2xl">
          <CardContent className="p-8 space-y-4 text-center">
            <h2 className="text-xl font-bold text-foreground">Verify your email first</h2>
            <p className="text-sm text-muted-foreground">
              Joining a community starts with verifying your email address.
            </p>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pendingResult) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Card className="w-full max-w-md shadow-lg rounded-2xl">
          <CardContent className="p-8 space-y-4 text-center">
            <Clock className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Request submitted</h2>
            <p className="text-sm text-muted-foreground">{pendingResult}</p>
            <Button className="w-full" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canSubmit =
    firstName.trim().length > 0 &&
    ((joinMode === "subdomain" && !!foundOrg) || (joinMode === "invite" && invitationCode.trim().length > 0));

  const handleSubmit = () => {
    if (!token || !canSubmit) return;
    joinMutation.mutate(
      {
        otpVerifiedToken: token,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        unitIdentifier: unitIdentifier.trim() || undefined,
        organizationId: joinMode === "subdomain" ? foundOrg?.organization_id : undefined,
        invitationCode: joinMode === "invite" ? invitationCode.trim() : undefined,
      },
      {
        onSuccess: (data) => {
          if (data.status === "pending") {
            setPendingResult(data.message);
          }
        },
      }
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background py-8">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Join a Community</h2>
            <p className="text-sm text-muted-foreground">Find your society, academy, or club to get started.</p>
          </div>

          <Tabs value={joinMode} onValueChange={(v) => setJoinMode(v as "subdomain" | "invite")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="subdomain">Community Code</TabsTrigger>
              <TabsTrigger value="invite">Invitation Code</TabsTrigger>
            </TabsList>

            <TabsContent value="subdomain" className="pt-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. green-acres"
                  value={subdomain}
                  onChange={(e) => {
                    setSubdomain(e.target.value);
                    setFoundOrg(null);
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!subdomain.trim() || lookupMutation.isPending}
                  onClick={() => lookupMutation.mutate(subdomain)}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              {lookupMutation.isError && (
                <p className="text-sm text-destructive">Community not found. Check the code and try again.</p>
              )}
              {foundOrg && (
                <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-primary/5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{foundOrg.organization_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {foundOrg.organization_type.replace("_", " ")} ·{" "}
                      {foundOrg.membership_model === "approval_required"
                        ? "Requires admin approval"
                        : "Open membership"}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="invite" className="pt-3 space-y-3">
              <Input
                placeholder="Enter your invitation code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                An invitation code instantly grants membership — no approval wait.
              </p>
            </TabsContent>
          </Tabs>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground">First Name</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Last Name</label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">House / Flat / Unit No. (optional)</label>
              <Input value={unitIdentifier} onChange={(e) => setUnitIdentifier(e.target.value)} placeholder="e.g. B-304" />
            </div>
          </div>

          <Button shape="pill" className="w-full" disabled={!canSubmit || joinMutation.isPending} onClick={handleSubmit}>
            {joinMutation.isPending ? "Submitting..." : "Join Community"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
