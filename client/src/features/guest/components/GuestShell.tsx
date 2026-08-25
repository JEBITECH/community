import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hexToHslTriplet } from "@/utils/hexToHsl";
import { PublicOrganization } from "../api/guest";
import { Users } from "lucide-react";

/** Minimal, sidebar-free shell for unauthenticated guest pages, branded off
 * the org resolved by subdomain rather than an authenticated membership
 * (BrandingContext is membership-based and doesn't apply here). */
export default function GuestShell({
  organization,
  children,
}: {
  organization?: PublicOrganization;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    const applied: string[] = [];
    const primary = organization?.themeConfig?.primary_color;
    const secondary = organization?.themeConfig?.secondary_color;

    if (primary) {
      const hsl = hexToHslTriplet(primary);
      if (hsl) {
        ["--primary", "--primary-bg", "--ring", "--sidebar-primary", "--sidebar-ring"].forEach((k) => {
          root.style.setProperty(k, hsl);
          applied.push(k);
        });
      }
    }
    if (secondary) {
      const hsl = hexToHslTriplet(secondary);
      if (hsl) {
        ["--secondary", "--sidebar-accent-foreground"].forEach((k) => {
          root.style.setProperty(k, hsl);
          applied.push(k);
        });
      }
    }
    return () => applied.forEach((k) => root.style.removeProperty(k));
  }, [organization?.themeConfig?.primary_color, organization?.themeConfig?.secondary_color]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => navigate(-1)}>
          {organization?.organization_logo ? (
            <img src={organization.organization_logo} alt={organization.organization_name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground leading-tight">{organization?.organization_name || "Community"}</p>
            <p className="text-xs text-muted-foreground leading-tight">Guest access</p>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
