import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getUserBankAccounts, 
  getUserBankAccountById, 
  createUserBankAccount, 
  updateUserBankAccount, 
  deleteUserBankAccount,
  UserBankAccount 
} from '../api/user-bank-account.api';

export const useGetUserBankAccounts = (userId: string) => {
  return useQuery({
    queryKey: ['user-bank-accounts', userId],
    queryFn: () => getUserBankAccounts(userId),
    enabled: !!userId,
  });
};

export const useGetUserBankAccountById = (id: number) => {
  return useQuery({
    queryKey: ['user-bank-account', id],
    queryFn: () => getUserBankAccountById(id),
    enabled: !!id,
  });
};

export const useCreateUserBankAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<UserBankAccount, 'id'>) => createUserBankAccount(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-bank-accounts', variables.user_id] });
    },
  });
};

export const useUpdateUserBankAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserBankAccount> }) => 
      updateUserBankAccount(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-bank-account', variables.id] });
      if (variables.data.user_id) {
        queryClient.invalidateQueries({ queryKey: ['user-bank-accounts', variables.data.user_id] });
      }
    },
  });
};

export const useDeleteUserBankAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { id: number; userId: string }) => deleteUserBankAccount(params.id),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['user-bank-accounts', params.userId] });
    },
  });
};
