import { Injectable } from '@nestjs/common';
import { EstadoDesafio } from '../enums/estado-desafio.enum';
import { ZONA_HORARIA_DEFAULT } from '../constants/zona-horaria-default';
import { obtenerFechaCalendarioHoy } from '../utils/fechas.util';

export interface DesafioParaEstado {
  cancelado: boolean;
  fechaInicio: string;
  fechaFin: string;
}

@Injectable()
export class EstadoDesafioService {
  obtenerEstado(
    desafio: DesafioParaEstado,
    fechaReferencia?: string,
  ): EstadoDesafio {
    if (desafio.cancelado) {
      return EstadoDesafio.CANCELADO;
    }

    const hoy = fechaReferencia ?? obtenerFechaCalendarioHoy(ZONA_HORARIA_DEFAULT);

    if (hoy < desafio.fechaInicio) {
      return EstadoDesafio.PROGRAMADO;
    }
    if (hoy > desafio.fechaFin) {
      return EstadoDesafio.FINALIZADO;
    }
    return EstadoDesafio.ACTIVO;
  }

  esVigente(estado: EstadoDesafio): boolean {
    return (
      estado === EstadoDesafio.PROGRAMADO || estado === EstadoDesafio.ACTIVO
    );
  }

  esOperable(estado: EstadoDesafio): boolean {
    return estado !== EstadoDesafio.FINALIZADO && estado !== EstadoDesafio.CANCELADO;
  }
}
