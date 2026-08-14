import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";
import { isOrgniaztionEmailUnique } from "../api";
export interface CheckEmailResponse {
  email: string;
  isUnique: boolean;
}
// Omit only queryKey and queryFn, but keep 'enabled' so the user can pass it
export const useCheckOrganizationEmail = (
  email: string,
  options?: Omit<UseQueryOptions<CheckEmailResponse, Error, CheckEmailResponse, QueryKey>, "queryKey" | "queryFn">
) => {
  return useQuery<CheckEmailResponse>({
    queryKey: ["organization", email],
    queryFn: () => isOrgniaztionEmailUnique(email),
    enabled: false, // default behavior
    ...options,       // user can override enabled
  });
};
