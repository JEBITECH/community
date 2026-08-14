import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

class Meta {
  itemsPerPage: number | undefined;
  totalItems: number | undefined;
  currentPage: number | undefined;
  totalPages: number | undefined;
  sortBy: string[][] | undefined;
  search: string | undefined;
}

class Links {
  first: string | undefined;
  previous: string | undefined;
  current: string | undefined;
  next: string | undefined;
  last: string | undefined;
}

class PaginateResponse<T> {
  constructor(public data: T[], public meta: Meta, public links: Links) {}
}

export const ApiPaginateResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(PaginateResponse),
    ApiOkResponse({
      schema: {
        allOf: [
          {
            $ref: getSchemaPath(PaginateResponse),
          },
          {
            properties: {
              data: {
                type: 'array',
                items: {
                  $ref: getSchemaPath(model),
                },
              },
              meta: {
                type: 'object',
                properties: {
                  itemsPerPage: {
                    type: 'number',
                  },
                  totalItems: {
                    type: 'number',
                  },
                  currentPage: {
                    type: 'number',
                  },
                  totalPages: {
                    type: 'number',
                  },
                  sortBy: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                    },
                  },
                  search: {
                    type: 'string',
                  },
                },
              },
              links: {
                type: 'object',
                properties: {
                  first: {
                    type: 'string',
                  },
                  previous: {
                    type: 'string',
                  },
                  current: {
                    type: 'string',
                  },
                  next: {
                    type: 'string',
                  },
                  last: {
                    type: 'string',
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};
