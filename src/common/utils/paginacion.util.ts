export interface MetaPaginacion {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function construirMetaPaginacion(
  total: number,
  page: number,
  limit: number,
): MetaPaginacion {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { page, limit, total, totalPages };
}

export function paginarArray<T>(
  items: T[],
  page: number,
  limit: number,
): { data: T[]; meta: MetaPaginacion } {
  const total = items.length;
  const inicio = (page - 1) * limit;
  const data = items.slice(inicio, inicio + limit);
  return {
    data,
    meta: construirMetaPaginacion(total, page, limit),
  };
}
