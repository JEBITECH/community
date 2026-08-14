import { apiRequest } from "@/lib/queryClient";
import { CheckEmailResponse } from "./hooks/checkOrganizationEmailUnique";

export const getOrganizations = () => apiRequest("GET", "/auth/organizations").then(res => res.json());
export const getOrganizationById = (id:number) => apiRequest("GET", `/auth/organizations/${id}`).then(res => res.json());
export const addOrganization = (data:any) => apiRequest("POST", "/auth/organizations", data).then(res => res.json());
export const isOrgniaztionEmailUnique = (email: string): Promise<CheckEmailResponse> =>
  apiRequest("GET", `/auth/organizations/check-email/${email}`).then(res => res.json());
export const updateOrganization = (id:number, data:any) => apiRequest("PATCH", `/auth/organizations/${id}`, data).then(res => res.json());
export const deleteOrganization = (id:number) => apiRequest("DELETE", `/auth/organizations/${id}`).then(res => res.json());
export const restoreOrganization = (id:number) => apiRequest("PATCH", `/auth/organizations/restore/${id}`).then(res => res.json());
export const getModules = () => apiRequest("GET", "/auth/modules").then(res => res.json());
export const getModulesWithInternal = () => apiRequest("GET", "/auth/modules?include_internal=true").then(res => res.json());
export const getFranchisesByFranchisorId = (
  franchisorId: number,
  params: { search?: string; page?: number; limit?: number } = {},
) => {
  const qs = new URLSearchParams();
  if (params.search)  qs.set('search', params.search);
  if (params.page)    qs.set('page',   String(params.page));
  if (params.limit)   qs.set('limit',  String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiRequest("GET", `/auth/organizations/franchises/${franchisorId}${query}`).then(res => res.json());
};
