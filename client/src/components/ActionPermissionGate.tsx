import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { hasActionAccess } from "@/utils/aclPermission";

interface ActionPermissionGateProps {
  moduleName: string;
  actionName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FULL_ACCESS_ROLES = ["master_admin", "super_admin"];

function AccessDeniedView({ actionName }: { actionName: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] px-4 flex flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You do not have permission to access {actionName}.
      </p>
      <Button className="mt-5" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </div>
  );
}

export function ActionPermissionGate({
  moduleName,
  actionName,
  children,
  fallback,
}: ActionPermissionGateProps) {
  const { user, modules } = useAuth();

  if (!user) return null;

  if (FULL_ACCESS_ROLES.includes(user.role) || hasActionAccess(modules, moduleName, actionName)) {
    return <>{children}</>;
  }

  return <>{fallback ?? <AccessDeniedView actionName={actionName} />}</>;
}
