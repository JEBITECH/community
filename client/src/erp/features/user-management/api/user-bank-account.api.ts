import { apiRequest } from "@/lib/queryClient";

export interface UserBankAccount {
  id?: number;
  user_id: string;
  bank_owner_name: string;
  bank_account_number: string;
  bank_account_code: string;
  is_default: boolean;
  is_active: boolean;
}

export const getUserBankAccounts = (userId: string) => 
  apiRequest("GET", `/auth/user-bank-account?filter.user_id=$eq:${userId}`).then(res => res.json());

export const getUserBankAccountById = (id: number) => 
  apiRequest("GET", `/auth/user-bank-account/${id}`).then(res => res.json());

export const createUserBankAccount = async (data: Omit<UserBankAccount, 'id'>) => {
  const res = await apiRequest("POST", "/auth/user-bank-account", data);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};

export const updateUserBankAccount = async (id: number, data: Partial<UserBankAccount>) => {
  const res = await apiRequest("PATCH", `/auth/user-bank-account/${id}`, data);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};

export const deleteUserBankAccount = async (id: number) => {
  const res = await apiRequest("DELETE", `/auth/user-bank-account/${id}`);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error);
  }
  return json;
};
