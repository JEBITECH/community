export interface PaginateQuery {
  page?: number;
  limit?: number;
  sortBy?: [string, "ASC" | "DESC"][];
  search?: string;
  filter?: Record<string, string | string[]>;
  pagination?: string;
}
