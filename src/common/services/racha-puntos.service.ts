import { Injectable } from '@nestjs/common';
import { addDays, differenceInCalendarDays, parseISO, format } from 'date-fns';
import {
  obtenerFechaCalendarioAyer,
  obtenerFechaCalendarioHoy,
} from '../utils/fechas.util';

@Injectable()
export class RachaPuntosService {
  calcularBonusRacha(rachaIncluyendoDia: number): number {
    if (rachaIncluyendoDia < 3) {
      return 0;
    }
    if (rachaIncluyendoDia <= 6) {
      return 5;
    }
    return 10;
  }

  calcularPuntosCheckIn(rachaIncluyendoDia: number): number {
    return 10 + this.calcularBonusRacha(rachaIncluyendoDia);
  }

  calcularRachaEnDia(diasCheckIn: string[], diaReferencia: string): number {
    const dias = new Set(diasCheckIn);
    if (!dias.has(diaReferencia)) {
      return 0;
    }
    let count = 0;
    let cursor = parseISO(diaReferencia);
    while (true) {
      const diaStr = format(cursor, 'yyyy-MM-dd');
      if (!dias.has(diaStr)) {
        break;
      }
      count += 1;
      cursor = addDays(cursor, -1);
    }
    return count;
  }

  calcularRachaActual(
    diasCheckIn: string[],
    zonaHoraria: string,
  ): number {
    const dias = new Set(diasCheckIn);
    const hoy = obtenerFechaCalendarioHoy(zonaHoraria);
    const ayer = obtenerFechaCalendarioAyer(zonaHoraria);

    let ancla: string | null = null;
    if (dias.has(hoy)) {
      ancla = hoy;
    } else if (dias.has(ayer)) {
      ancla = ayer;
    }

    if (!ancla) {
      return 0;
    }

    return this.calcularRachaEnDia(diasCheckIn, ancla);
  }

  calcularMejorRacha(diasCheckIn: string[]): number {
    const unicos = [...new Set(diasCheckIn)].sort();
    if (unicos.length === 0) {
      return 0;
    }

    let mejor = 1;
    let actual = 1;

    for (let indice = 1; indice < unicos.length; indice += 1) {
      const diferencia = differenceInCalendarDays(
        parseISO(unicos[indice]),
        parseISO(unicos[indice - 1]),
      );
      if (diferencia === 1) {
        actual += 1;
      } else {
        actual = 1;
      }
      mejor = Math.max(mejor, actual);
    }

    return mejor;
  }
}
