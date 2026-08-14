
import { apiRequest } from "@/lib/queryClient";

export const getRoleByOrganizationId = (id:number) => apiRequest("GET", `/auth/roles/${id}`).then(res => res.json());
export const addOrganizationRole = (data:any) => apiRequest("POST", "/auth/roles", data).then(res => res.json());
export const addRoleModuleAccess = (data:any) => apiRequest("POST", "/auth/role-module-access", data).then(res => res.json());
export const getRoleModuleAccessByOrganizationId = (organizationId:number, roleId:number) => apiRequest("GET", `/auth/role-module-access/${organizationId}/${roleId}`).then(res => res.json());