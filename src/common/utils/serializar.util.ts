import { Types } from 'mongoose';

function convertirValor(valor: unknown): unknown {
  if (valor instanceof Types.ObjectId) {
    return valor.toString();
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => convertirValor(item));
  }
  if (valor !== null && typeof valor === 'object' && !(valor instanceof Date)) {
    const resultado: Record<string, unknown> = {};
    for (const [clave, contenido] of Object.entries(valor)) {
      if (clave === '_id' || clave === '__v') {
        continue;
      }
      resultado[clave] = convertirValor(contenido);
    }
    return resultado;
  }
  return valor;
}

export function serializarDocumento<T extends Record<string, unknown>>(
  documento: unknown,
): T {
  if (!documento) {
    return documento as T;
  }

  const conToObject = documento as {
    toObject?: (options?: { versionKey?: boolean }) => Record<string, unknown>;
  };
  const plano =
    typeof conToObject.toObject === 'function'
      ? conToObject.toObject({ versionKey: false })
      : { ...(documento as Record<string, unknown>) };

  const id = plano._id?.toString();
  const sinMeta = convertirValor(plano) as Record<string, unknown>;
  delete sinMeta._id;

  return {
    ...sinMeta,
    ...(id ? { id } : {}),
  } as T;
}
