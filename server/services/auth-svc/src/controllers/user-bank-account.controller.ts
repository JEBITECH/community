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
import { UserBankAccountService } from "../services/user-bank-account.service";
import { CreateUserBankAccountDto } from "../dto/create-user-bank-account.dto";
import { Response } from "express";
import { Paginate, PaginateQuery } from "@shared/common";
import { ResponseSchema } from "routing-controllers-openapi";
import { UserBankAccount } from "@shared/entities";
import { UpdateUserBankAccountDto } from "../dto/update-user-bank-account.dto";

@JsonController("/auth/user-bank-account")
export class UserBankAccountController {
  private userBankAccountService: UserBankAccountService;

  constructor() {
    this.userBankAccountService = new UserBankAccountService();
  }

  @Post()
  async createBankAccount(
    @Body() dto: CreateUserBankAccountDto,
    @Res() res: Response,
  ) {
    try {
      const bankAccount = await this.userBankAccountService.create(dto);
      return res.status(201).json(bankAccount);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  @Patch("/:id")
  async updateBankAccountById(
    @Param("id") id: number,
    @Body() dto: UpdateUserBankAccountDto,
    @Res() res: Response,
  ) {
    try {
      const bankAccount = await this.userBankAccountService.update(+id, dto);
      return res.status(201).json(bankAccount);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  @Get()
  async getAllBankAccounts(
    @Paginate paginate: PaginateQuery,
    @Res() res: Response,
  ) {
    try {
      const result =
        await this.userBankAccountService.getAllBankAccounts(paginate);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to get Bank accounts",
      });
    }
  }

  @Get("/:id")
  @ResponseSchema(UserBankAccount)
  async findUserBankAccountById(@Param("id") id: number, @Res() res: Response) {
    try {
      const bankAccount = await this.userBankAccountService.findOne(+id);
      return res.status(201).json(bankAccount);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  @Delete("/:id")
  async remove(@Param("id") id: string, @Res() res: Response) {
    try {
      const organization = await this.userBankAccountService.remove(+id);

      return res.status(201).json({
        message: "Bank account deleted successfully",
        organization: organization,
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}
