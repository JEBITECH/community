// src/features/auth/hooks/useAuthMutations.ts

import { useMutation } from "@tanstack/react-query";
import { forgotPassword, loginUser, resetPassword, updateUserAccountDetail, userProfileByToken } from "../api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LoginInput, LoginResponse } from "../type";

export function useLoginMutation() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  return useMutation<LoginResponse, Error, LoginInput>({
      mutationFn: async (values: any) => {
          return await loginUser(values)
      },    
      onSuccess: (data:LoginResponse) => {
        login({ user: data.user, module_list_access_by_user: data.module_list_access_by_user, accessToken: data.accessToken, refreshToken: data.refreshToken });
        navigate("/");
        toast({
          title: "Success",
          description: "User logged in successfully",
        });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to login",
          variant: "destructive",
        });
      },
     }
    );
}

export function useForgotPasswordMutation() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (values: any) => await forgotPassword(values), 
    onSuccess: () => {
      navigate("/login");
      toast({
        title: "Success",
        description: "Password reset link sent. Check your email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request password reset",
        variant: "destructive",
      });
    },
  });
}

export function useResetPasswordMutation() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: async (values: any) => await resetPassword(values), 
    onSuccess: () => {
      navigate("/login");

      toast({
        title: "Success",
        description: "Password reset link sent. Check your email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request password reset",
        variant: "destructive",
      });
    },
  });
}

export function userProfileUpdateMutation() {
  const { toast } = useToast();
  const navigate = useNavigate();  
  return useMutation({
      mutationFn: async (values: any) => await updateUserAccountDetail(values),
      onSuccess: (data) => {
        console.log("Registration successful:", data);
        toast({
          title: "Success",
          description: "Your account has been setup sucessfully!",
        });
        navigate("/login");
      },
      onError: (error: any) => {
        console.error("Registration failed:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
      },
    })
}

export function userProfileByTokenMutation() {
  const { toast } = useToast();
  return useMutation({
      mutationFn: async (values: any) => await userProfileByToken(values),
      onSuccess: (data) => {
        console.log("Registration successful:", data);
        toast({
          title: "Success",
          description: "Your account has been setup sucessfully!",
        });        
      },
      onError: (error: any) => {
        console.error("Registration failed:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
      },
    })
}
