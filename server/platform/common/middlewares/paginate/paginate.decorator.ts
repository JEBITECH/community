import { createParamDecorator } from "routing-controllers";
import { PaginateQuery } from "./paginate-query.interface";

export const Paginate = createParamDecorator({
  required: false,
  value: (action): PaginateQuery => {
    const query = action.request.query;

    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Number(query.limit) || 20, 100);
    let filter: PaginateQuery["filter"];

    const sortBy = query.sortBy
      ? (JSON.parse(query.sortBy as string) as PaginateQuery["sortBy"])
      : undefined;

    if (query.filter) {
      filter =
        (JSON.parse(query.filter as string));
    } else {
      const filterEntries = Object.entries(query)
        .filter(([key]) => key.startsWith("filter."))
        .map(([key, value]) => [key.replace("filter.", ""), value]);

      filter = filterEntries.length
        ? Object.fromEntries(filterEntries)
        : undefined;
    }

    return {
      page,
      limit,
      sortBy,
      search: query.search as string,
      filter,
      pagination:
        query.pagination as string,
    };
  },
});
