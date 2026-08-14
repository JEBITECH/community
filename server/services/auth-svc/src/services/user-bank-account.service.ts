import { UserBankAccount } from "@shared/entities";
import { AppDataSource } from "../db";
import { Repository } from "typeorm";
import { CreateUserBankAccountDto } from "../dto/create-user-bank-account.dto";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { PaginateQuery } from "@shared/common";
import { FilterOperator, paginate, Paginated } from "nestjs-paginate";
import { UpdateUserBankAccountDto } from "../dto/update-user-bank-account.dto";

export class UserBankAccountService {
  private repository: Repository<UserBankAccount>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserBankAccount);
  }

  create(dto: CreateUserBankAccountDto): Promise<UserBankAccount> {
    const bankAccount = this.repository.create(dto);

    try {
      return this.repository.save(bankAccount);
    } catch (error) {
      throw new BadRequestError(error.message);
    }
  }

  async update(id: number, dto: UpdateUserBankAccountDto) {
    const entity = await this.repository.preload({
      id,
      ...dto,
    });
    if (!entity) {
      throw new NotFoundError();
    }

    return await this.repository.save(entity);
  }

  getAllBankAccounts(
    query: PaginateQuery,
  ): Promise<Paginated<UserBankAccount>> {
    const selectQuery = this.repository.createQueryBuilder("userbankaccount");

    return paginate(query as any, selectQuery, {
      filterableColumns: {
        user_id: [FilterOperator.EQ],
        is_active: [FilterOperator.EQ],
      },
      searchableColumns: [
        "bank_owner_name",
        "bank_account_number",
        "bank_account_code",
      ],
      sortableColumns: ["createdAt"],
      defaultSortBy: [["createdAt", "DESC"]],
      defaultLimit: 10,
    });
  }

  findOne(id: number): Promise<UserBankAccount> {
    try {
      return this.repository.findOneByOrFail({ id });
    } catch (error) {
      throw new NotFoundError(error.message);
    }
  }

  remove(id: number) {
    return this.repository.delete(id);
  }
}
