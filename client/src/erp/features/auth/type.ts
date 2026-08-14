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