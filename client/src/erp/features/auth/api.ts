import { apiRequest } from "@/lib/queryClient";
import {
  LoginInput,
  LoginResponse,
  OtpRequestInput,
  OtpRequestResponse,
  OtpVerifyInput,
  OtpVerifyResponse,
  JoinCommunityInput,
  JoinCommunityResponse,
  OrganizationPreview,
} from "./type";

export async function loginUser(data: LoginInput): Promise<LoginResponse> {
  try {
    const res = await apiRequest("POST", "/auth/login", data);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to login");
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
}

export async function requestOtp(data: OtpRequestInput): Promise<OtpRequestResponse> {
  const res = await apiRequest("POST", "/auth/otp/request", data);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to send OTP");
  }
  return res.json();
}

export async function verifyOtp(data: OtpVerifyInput): Promise<OtpVerifyResponse> {
  const res = await apiRequest("POST", "/auth/otp/verify", data);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "OTP verification failed");
  }
  return res.json();
}

export async function joinCommunity(data: JoinCommunityInput): Promise<JoinCommunityResponse> {
  const res = await apiRequest("POST", "/auth/join-community", data);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to join community");
  }
  return res.json();
}

export async function getOrganizationBySubdomain(subdomain: string): Promise<OrganizationPreview> {
  const res = await apiRequest("GET", `/auth/organizations/by-subdomain/${encodeURIComponent(subdomain)}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Community not found");
  }
  return res.json();
}

export async function forgotPassword(data: { email: string }) {
  try {
    const res = await apiRequest("POST", "/auth/reset-password", data);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to request password reset");
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to request password reset");
  }
}

export async function resetPassword(data: { password: string; token: string }) {
  try {
    const res = await apiRequest("POST", "/auth/confirm-password-reset", data);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to reset password");
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to reset password");
  }
}

export async function updateUserAccountDetail(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: string;
}) {
  try {
    const res = await apiRequest("PATCH", "/auth/user/edit-user", data);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to update user");
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to update user");
  }
}

export async function userProfileByToken(data: { token: string }) {
  try {
    const res = await apiRequest("POST", "/auth/user/user-by-token", data);
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to fetch user profile");
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch user profile");
  }
}
