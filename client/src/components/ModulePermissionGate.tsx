import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { hasModuleAccess } from "@/utils/aclPermission";

interface ModulePermissionGateProps {
  moduleName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FULL_ACCESS_ROLES = ["master_admin"];

function AccessDeniedView({ moduleName }: { moduleName: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] px-4 flex flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-destructive/10 p-4 text-destructive">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You do not have permission to access {moduleName}.
      </p>
      <Button className="mt-5" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </div>
  );
}

export function ModulePermissionGate({
  moduleName,
  children,
  fallback,
}: ModulePermissionGateProps) {
  const { user, modules } = useAuth();

  if (!user) return null;

  if (FULL_ACCESS_ROLES.includes(user.role) || hasModuleAccess(modules, moduleName)) {
    return <>{children}</>;
  }

  return <>{fallback ?? <AccessDeniedView moduleName={moduleName} />}</>;
}
