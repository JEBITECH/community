import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, getUserById, getUserByOrganizationId, getUnitsByPropertyIds, inviteUser, reInviteUser, updateUser, updateFCMToken } from "../api";
import { useToast } from "@/hooks/use-toast";

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
          title: "Success",
          description: "User logged in successfully",
          variant: "success"
        });
    },
     onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed !",
          variant: "destructive",
        });
      },
  });
};

export const useInviteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
        return await inviteUser(values)
    },  
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // Don't show toast here - let the component handle it
    },
    // Don't show error toast here - let the component handle it for better control
  });
};

export const useReInviteUser = () => {
  const { toast } = useToast();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
        return await reInviteUser(values)
    },  
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
          title: "Success",
          description: "User Re-invited successfully",
          variant:"success"
        });
    },
     onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed !",
          variant: "destructive",
        });
      },
  });
}

export const useGetUserById = (id: string | number | null | undefined) => {
  return useQuery({
    queryKey: ["user_by_id", id],
    queryFn: async () => {
      if (!id) {
        throw new Error("User ID is required");
      }
      return await getUserById(id);
    },
    enabled: !!id, 
    retry: false,
  });
};



export const useGetUserByOrganizationId = (id: any, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["user_by_organization_id", id],
    queryFn: () => getUserByOrganizationId(id),
    enabled: options?.enabled ?? !!id,
  });
};
export const useGetUser = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: any) => {
        return await getUserById(values);
    },  
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
          title: "Success",
          description: "User Re-invited successfully",
          variant:"success"
        });
    },
     onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed !",
          variant: "destructive",
        });
      },
  });
}


export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => updateUser(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user_by_id", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
        variant: "success"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFCMToken = () => {
  return useMutation({
    mutationFn: ({ data }: { data: { fcm_token: string } }) => updateFCMToken(data),
    onSuccess: (_, variables) => {
      console.log("FCM token updated successfully");
    },
    onError: (error: Error) => {
      console.error("Failed to update FCM token:", error);
    },
  });
};


export const useGetUnitsByPropertyIds = (propertyIds: number[], organizationId: number | undefined) => {
  return useQuery({
    queryKey: ['units-by-property-ids', propertyIds, organizationId],
    queryFn: () => getUnitsByPropertyIds(propertyIds, organizationId!),
    enabled: propertyIds.length > 0 && !!organizationId,
    staleTime: 5 * 60 * 1000,
  });
};
