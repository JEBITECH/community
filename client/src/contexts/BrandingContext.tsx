import { createContext, useContext, useEffect, ReactNode } from "react";
import { useOrganizationContext } from "./OrganizationContext";
import { hexToHslTriplet } from "@/utils/hexToHsl";

// Must match the custom-property names index.css defines under :root/.dark —
// branding is a runtime override of the same tokens shadcn components read,
// so no component-level changes are needed for a org's colors to take effect.
const BRANDED_TOKENS: Record<string, (hsl: string) => Record<string, string>> = {
  primary: (hsl) => ({ "--primary": hsl, "--primary-bg": hsl, "--ring": hsl, "--sidebar-primary": hsl, "--sidebar-ring": hsl }),
  secondary: (hsl) => ({ "--secondary": hsl, "--sidebar-accent-foreground": hsl }),
};

interface BrandingContextValue {
  hasCustomBranding: boolean;
}

const BrandingContext = createContext<BrandingContextValue>({ hasCustomBranding: false });

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { activeMembership, isMasterAdmin } = useOrganizationContext();
  const theme = isMasterAdmin ? null : activeMembership?.organization?.themeConfig;

  useEffect(() => {
    const root = document.documentElement;
    const applied: string[] = [];

    if (theme?.primary_color) {
      const hsl = hexToHslTriplet(theme.primary_color);
      if (hsl) {
        Object.entries(BRANDED_TOKENS.primary(hsl)).forEach(([k, v]) => {
          root.style.setProperty(k, v);
          applied.push(k);
        });
      }
    }

    if (theme?.secondary_color) {
      const hsl = hexToHslTriplet(theme.secondary_color);
      if (hsl) {
        Object.entries(BRANDED_TOKENS.secondary(hsl)).forEach(([k, v]) => {
          root.style.setProperty(k, v);
          applied.push(k);
        });
      }
    }

    // Switching orgs (or landing on one without custom branding) must clear
    // any previous org's override rather than leaving it stuck.
    return () => {
      applied.forEach((k) => root.style.removeProperty(k));
    };
  }, [theme?.primary_color, theme?.secondary_color]);

  return (
    <BrandingContext.Provider value={{ hasCustomBranding: !!(theme?.primary_color || theme?.secondary_color) }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
