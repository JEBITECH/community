import { apiRequest } from "@/lib/queryClient";

export const getOrganizations = () => apiRequest("GET", "/auth/organizations").then(res => res.json());
export const getOrganizationById = (id: number) => apiRequest("GET", `/auth/organizations/${id}`).then(res => res.json());
export const checkSubdomainUnique = (subdomain: string) => apiRequest("GET", `/auth/organizations/check-subdomain/${subdomain}`).then(res => res.json());
export const createOrganization = (data: any) => apiRequest("POST", "/auth/organizations", data).then(res => res.json());
export const updateOrganization = (id: number, data: any) => apiRequest("PATCH", `/auth/organizations/${id}`, data).then(res => res.json());
export const suspendOrganization = (id: number) => apiRequest("PATCH", `/auth/organizations/${id}/suspend`).then(res => res.json());
export const reactivateOrganization = (id: number) => apiRequest("PATCH", `/auth/organizations/${id}/reactivate`).then(res => res.json());
export const archiveOrganization = (id: number) => apiRequest("PATCH", `/auth/organizations/archive/${id}`).then(res => res.json());
export const restoreOrganization = (id: number) => apiRequest("PATCH", `/auth/organizations/restore/${id}`).then(res => res.json());
export const getModules = () => apiRequest("GET", "/auth/modules").then(res => res.json());
export const getModulesWithInternal = () => apiRequest("GET", "/auth/modules?include_internal=true").then(res => res.json());
