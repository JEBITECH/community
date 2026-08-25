import { apiRequest } from "@/lib/queryClient";

export const getMyMemberships = () => apiRequest("GET", "/auth/me/memberships").then(res => res.json());
export const switchOrganization = (organizationId: number) =>
  apiRequest("POST", "/auth/me/switch-org", { organizationId }).then(res => res.json());
