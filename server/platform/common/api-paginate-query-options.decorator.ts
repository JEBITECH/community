import { ApiQuery } from "@nestjs/swagger";
import { applyDecorators } from "@nestjs/common";

export function ApiPaginateQueryOptions() {
  return applyDecorators(
    ApiQuery({ name: "page", required: false }),
    ApiQuery({ name: "limit", required: false }),
    ApiQuery({ name: "search", required: false }),
    ApiQuery({ name: "sortBy", required: false }),
  );
}
