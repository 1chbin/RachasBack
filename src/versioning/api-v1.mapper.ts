import { EstadoDesafio } from '../common/enums/estado-desafio.enum';

type RecordLike = Record<string, unknown>;

function mapEstadoV1(estado: unknown): unknown {
  if (estado === EstadoDesafio.PAUSADO) {
    return EstadoDesafio.ACTIVO;
  }
  return estado;
}

export function mapDesafioV1<T extends RecordLike>(desafio: T): RecordLike {
  const { finalizaEn, pausado, ...resto } = desafio;
  void pausado;
  return {
    ...resto,
    fechaFin: finalizaEn,
    estado: mapEstadoV1(desafio.estado),
  };
}

export function mapCheckInV1<T extends RecordLike>(checkIn: T): RecordLike {
  const puntos = checkIn.puntos;
  const puntosNumero =
    typeof puntos === 'number'
      ? puntos
      : typeof puntos === 'object' &&
          puntos !== null &&
          'total' in (puntos as RecordLike)
        ? (puntos as { total: number }).total
        : 0;
  return {
    ...checkIn,
    puntos: puntosNumero,
  };
}

export function mapRankingResponseV1<T extends RecordLike>(payload: T): RecordLike {
  return {
    ...payload,
    estado: mapEstadoV1(payload.estado),
    ranking: Array.isArray(payload.ranking)
      ? payload.ranking.map((fila) => ({ ...(fila as RecordLike) }))
      : payload.ranking,
  };
}

export function mapResumenInicioV1<T extends RecordLike>(payload: T): RecordLike {
  if (!Array.isArray(payload.desafios)) {
    return payload;
  }
  return {
    ...payload,
    desafios: payload.desafios.map((item) => {
      const fila = item as RecordLike;
      if (fila.desafio && typeof fila.desafio === 'object') {
        return {
          ...fila,
          desafio: mapDesafioV1(fila.desafio as RecordLike),
        };
      }
      return fila;
    }),
  };
}

export function mapPaginatedDesafiosV1<T extends RecordLike>(payload: T): RecordLike {
  if (!Array.isArray(payload.data)) {
    return payload;
  }
  return {
    ...payload,
    data: payload.data.map((d) => mapDesafioV1(d as RecordLike)),
  };
}

export function mapPaginatedCheckInsV1<T extends RecordLike>(payload: T): RecordLike {
  if (!Array.isArray(payload.data)) {
    return payload;
  }
  return {
    ...payload,
    data: payload.data.map((c) => mapCheckInV1(c as RecordLike)),
  };
}

export function mapDeepV1(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => mapDeepV1(item));
  }
  if (value && typeof value === 'object') {
    const record = value as RecordLike;
    if ('finalizaEn' in record || 'fechaInicio' in record) {
      return mapDesafioV1(record);
    }
    if ('zonaHorariaUsada' in record && 'puntos' in record) {
      return mapCheckInV1(record);
    }
    const mapped: RecordLike = {};
    for (const [key, nested] of Object.entries(record)) {
      mapped[key] = mapDeepV1(nested);
    }
    return mapped;
  }
  return value;
}
