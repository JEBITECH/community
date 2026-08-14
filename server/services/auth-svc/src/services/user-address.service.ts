import { UserAddress } from "@shared/entities";
import { AppDataSource } from "../db";
import { Repository } from "typeorm";
import { CreateUserAddressDto } from "../dto/create-user-address.dto";
import { BadRequestError, NotFoundError } from "routing-controllers";
import { UpdateUserAddressDto } from "../dto/update-user-address.dto";
import { PaginateQuery } from "@shared/common";
import { FilterOperator, paginate } from "nestjs-paginate";

export class UserAddressService {
  private repository: Repository<UserAddress>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserAddress);
  }

  create(dto: CreateUserAddressDto) {
    const address = this.repository.create(dto);
    try {
      return this.repository.save(address);
    } catch (error) {
      throw new BadRequestError(error.message);
    }
  }

  async update(id: number, dto: UpdateUserAddressDto) {
    const entity = await this.repository.preload({
      id,
      ...dto,
    });
    if (!entity) {
      throw new NotFoundError();
    }

    return await this.repository.save(entity);
  }

  findAllAddress(query: PaginateQuery) {
    const selectQuery = this.repository.createQueryBuilder("userbankaccount");

    return paginate(query as any, selectQuery, {
      filterableColumns: {
        address_type: [FilterOperator.EQ],
        user_id: [FilterOperator.EQ],
      },
      searchableColumns: ["full"],
      sortableColumns: ["id"],
      defaultSortBy: [["id", "DESC"]],
      defaultLimit: 10,
    });
  }

  findOne(id: number): Promise<UserAddress> {
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
