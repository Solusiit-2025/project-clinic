export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function getPaginationOptions(params: PaginationParams) {
  const page = params.page ? Math.max(1, Number(params.page)) : 1;
  const limit = params.limit ? Math.max(1, Number(params.limit)) : 50;
  const skip = (page - 1) * limit;
  
  return {
    skip,
    take: limit,
    page,
    limit
  };
}
