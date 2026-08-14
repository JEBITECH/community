import { apiRequest } from "@/lib/queryClient";

export const getUsers = (page = 1, limit = 10, organizationId?: number | null, search?: string) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (organizationId) params.append("filter", JSON.stringify({ organization_id: `$eq:${organizationId}` }));
  if (search) params.append("search", search);
  return apiRequest("GET", `/auth/user/all-user?${params.toString()}`).then(res => res.json());
};
export const getUserById = (id:any) => apiRequest("GET", `/auth/user/${id}`).then(res => res.json());
export const getUserByOrganizationId = (id:any) => apiRequest("GET", `/auth/user/organization/${id}`).then(res => res.json());

export const inviteUser = async (data: any) => {
  const res = await apiRequest("POST", "/auth/user/invite-user", data);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};

export const createUser = async (data: any) => {
  const res = await apiRequest("POST", "/auth/users", data);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};

export const reInviteUser = async (id: any) => {
  const res = await apiRequest("GET", `/auth/user/reinvite-user/${id}`);
  const json = await res.json();
  if (json.error || (json.status === false && json.message)) {
    throw new Error(json.error || json.message);
  }
  return json;
};

export const updateUser = async (userId: string, data: any) => {
  const res = await apiRequest("PUT", `/auth/user/${userId}`, data);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};

export const updateFCMToken = async (data: any) => {
  const res = await apiRequest("PUT", `/auth/user/fcm-token`, data);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};

export const getRoles = () => apiRequest("GET", "/auth/roles").then(res => res.json());

export const getUnitsByPropertyIds = (propertyIds: number[], organizationId: number) => {
  const params = new URLSearchParams({
    organization_id: String(organizationId),
    'filter.property_id': `$in:${propertyIds.join(',')}`,
    limit: '1000',
  });
  return apiRequest("GET", `/data-import/units?${params.toString()}`).then(res => res.json());
};