import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getUserAddresses, 
  getUserAddressById, 
  createUserAddress, 
  updateUserAddress, 
  deleteUserAddress,
  UserAddress 
} from '../api/user-address.api';

export const useGetUserAddresses = (userId: string) => {
  return useQuery({
    queryKey: ['user-addresses', userId],
    queryFn: () => getUserAddresses(userId),
    enabled: !!userId,
  });
};

export const useGetUserAddressById = (id: number) => {
  return useQuery({
    queryKey: ['user-address', id],
    queryFn: () => getUserAddressById(id),
    enabled: !!id,
  });
};

export const useCreateUserAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Omit<UserAddress, 'id'>) => createUserAddress(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', variables.user_id] });
    },
  });
};

export const useUpdateUserAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserAddress> }) => 
      updateUserAddress(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-address', variables.id] });
      if (variables.data.user_id) {
        queryClient.invalidateQueries({ queryKey: ['user-addresses', variables.data.user_id] });
      }
    },
  });
};

export const useDeleteUserAddress = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: { id: number; userId: string }) => deleteUserAddress(params.id),
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses', params.userId] });
    },
  });
};
