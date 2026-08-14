import { CreateUserBankAccountDto } from "./create-user-bank-account.dto";

export type UpdateUserBankAccountDto = Partial<CreateUserBankAccountDto> & {
  id: number;
};
