import { CreateUserAddressDto } from "../dto/create-user-address.dto";
import {
  Body,
  Delete,
  Get,
  JsonController,
  Param,
  Patch,
  Post,
  Res,
} from "routing-controllers";
import { UserAddressService } from "../services/user-address.service";
import { Response } from "express";
import { UpdateUserAddressDto } from "../dto/update-user-address.dto";
import { UserAddress } from "@shared/entities";
import { ResponseSchema } from "routing-controllers-openapi";
import { Paginate, PaginateQuery } from "@shared/common";

@JsonController("/auth/user-address")
export class UserAddressController {
  private userAddressService: UserAddressService;

  constructor() {
    this.userAddressService = new UserAddressService();
  }

  @Post()
  async createUserAddress(
    @Body() dto: CreateUserAddressDto,
    @Res() res: Response,
  ) {
    try {
      const address = await this.userAddressService.create(dto);
      return res.status(201).json(address);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  @Patch("/:id")
  async updateUserAddressById(
    @Param("id") id: number,
    @Body() dto: UpdateUserAddressDto,
    @Res() res: Response,
  ) {
    try {
      const updatedAddress = await this.userAddressService.update(+id, dto);
      return res.status(201).json(updatedAddress);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  @Get()
  async getAllUserAddresses(
    @Paginate paginate: PaginateQuery,
    @Res() res: Response,
  ) {
    try {
      const result = await this.userAddressService.findAllAddress(paginate);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get User addresses",
      });
    }
  }

  @Get("/:id")
  @ResponseSchema(UserAddress)
  async findUserAddressById(@Param("id") id: number, @Res() res: Response) {
    try {
      const address = await this.userAddressService.findOne(+id);
      return res.status(201).json(address);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  @Delete("/:id")
  async remove(@Param("id") id: string, @Res() res: Response) {
    try {
      const organization = await this.userAddressService.remove(+id);

      return res.status(201).json({
        message: "User address deleted successfully",
        organization: organization,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}
