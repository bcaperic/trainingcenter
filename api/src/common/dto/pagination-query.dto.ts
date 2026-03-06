import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @IsOptional()
  @IsString()
  sort?: string = 'createdAt';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  q?: string;
}

export function paginate(query: PaginationQueryDto) {
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function paginatedResponse<T>(data: T[], total: number, query: PaginationQueryDto) {
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
