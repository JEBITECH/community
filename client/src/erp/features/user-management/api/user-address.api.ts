import { apiRequest } from "@/lib/queryClient";

export interface UserAddress {
  id?: number;
  user_id: string;
  address_type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  full: string;
  street?: string;
  city?: string;
  province?: string;
  zip_code?: string;
  country?: string;
  lat?: number;
  lng?: number;
  is_default: boolean;
}

export const getUserAddresses = (userId: string) => 
  apiRequest("GET", `/auth/user-address?filter.user_id=$eq:${userId}`).then(res => res.json());

export const getUserAddressById = (id: number) => 
  apiRequest("GET", `/auth/user-address/${id}`).then(res => res.json());

export const createUserAddress = async (data: Omit<UserAddress, 'id'>) => {
  const res = await apiRequest("POST", "/auth/user-address", data);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};

export const updateUserAddress = async (id: number, data: Partial<UserAddress>) => {
  const res = await apiRequest("PATCH", `/auth/user-address/${id}`, data);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};

export const deleteUserAddress = async (id: number) => {
  const res = await apiRequest("DELETE", `/auth/user-address/${id}`);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};
