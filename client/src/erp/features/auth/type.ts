export type LoginInput = {
  email: string;
  password: string;
};


export type SubAction = {
  sub_Action_id: number;
  name: string;
  status: boolean;
};

export type Action = {
  action_id: number;
  name: string;
  status: boolean;
  sub_action_list: SubAction[];
};

export type ModuleAccess = {
  module_id: number;
  name: string;
  status: boolean;
  action_list: Action[];
};



export type LoginResponse = {
  user: any;
  accessToken: string;
  refreshToken: string;
  module_list_access_by_user: ModuleAccess[],
};

export type OtpRequestInput = { phone: string };
export type OtpRequestResponse = { message: string; debug_otp?: string };

export type OtpVerifyInput = { phone: string; code: string };
export type OtpVerifyResponse =
  | { isNewUser: true; otpVerifiedToken: string }
  | ({ isNewUser: false; message: string } & LoginResponse);

export type JoinCommunityInput = {
  otpVerifiedToken: string;
  firstName: string;
  lastName?: string;
  unitIdentifier?: string;
  organizationId?: number;
  invitationCode?: string;
};

export type JoinCommunityResponse =
  | { status: "pending"; message: string; membership: any }
  | ({ status: "active"; message: string } & LoginResponse);

export type OrganizationPreview = {
  organization_id: number;
  organization_name: string;
  organization_type: string;
  organization_logo?: string;
  membership_model: "open" | "approval_required" | "invite_only";
  subdomain: string;
};

export type Membership = {
  id: string;
  organization_id: number;
  role: string;
  member_type: string;
  status: "pending" | "active" | "suspended" | "rejected";
  is_default: boolean;
  organization: {
    id: number;
    organization_name: string;
    organization_email: string;
    organization_location: string;
    organization_logo?: string;
    subdomain: string;
  };
};