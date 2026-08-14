import { CreateUserAddressDto } from "./create-user-address.dto";

export type UpdateUserAddressDto = Partial<CreateUserAddressDto> & {
  id: number;
};
