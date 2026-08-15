import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useOrganizationContext } from "@/contexts/OrganizationContext";
import React from "react";

interface HeaderProps {
  onNewImport?: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function Header({ title = "Dashboard Overview", subtitle = "Monitor data imports and system status", icon }: HeaderProps) {
  const { selectedOrganizationId, setSelectedOrganizationId, selectedOrganization, organizations, isLoadingOrganizations, isMasterAdmin } = useOrganizationContext();

  return (
    <header className="px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col space-y-1 flex-1 min-w-0">
          <div className="text-center lg:text-left">
            <h1 className="text-heading-1 text-foreground flex items-center">
              {icon && <span className="mr-3 text-primary">{icon}</span>}
              {title}
            </h1>
          </div>
          <div className="hidden lg:block text-center lg:text-left">
            <p className="text-body-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Organization Selector - dropdown when there's a choice (master admin,
              or a member belonging to more than one community), read-only otherwise */}
          {isMasterAdmin || organizations.length > 1 ? (
            <Select
              value={selectedOrganizationId?.toString() || ""}
              onValueChange={(v) => setSelectedOrganizationId(parseInt(v))}
              disabled={isLoadingOrganizations}
            >
              <SelectTrigger className="h-10 min-w-56 max-w-72 border-0 bg-primary/5 hover:bg-primary/10 text-sm font-medium rounded-lg px-3 gap-2 transition-colors focus:ring-1 focus:ring-primary/30">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 shrink-0">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="truncate text-foreground">
                    {isLoadingOrganizations ? "Loading..." : selectedOrganization?.name || "Select Organization"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-80 min-w-56">
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id.toString()} className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded bg-primary/10 shrink-0">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{org.name}</div>
                        {org.location && (
                          <div className="text-xs text-muted-foreground truncate">{org.location}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : selectedOrganization ? (
            <div className="flex items-center gap-2 px-3 h-10 rounded-lg bg-primary/5 text-sm font-medium min-w-48 max-w-72">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <span className="text-foreground truncate">{selectedOrganization.name}</span>
            </div>
          ) : null}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
