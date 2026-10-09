import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';

export function obtenerFechaCalendarioHoy(zonaHoraria: string): string {
  return formatInTimeZone(new Date(), zonaHoraria, 'yyyy-MM-dd');
}

export function obtenerFechaCalendarioAyer(zonaHoraria: string): string {
  const hoyEnZona = toZonedTime(new Date(), zonaHoraria);
  const ayer = addDays(hoyEnZona, -1);
  return formatInTimeZone(ayer, zonaHoraria, 'yyyy-MM-dd');
}

export function diasInclusive(fechaInicio: string, fechaFin: string): number {
  const inicio = parseISO(fechaInicio);
  const fin = parseISO(fechaFin);
  return differenceInCalendarDays(fin, inicio) + 1;
}

export function esFechaCalendarioValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }
  const fecha = parseISO(valor);
  return formatInTimeZone(fecha, 'UTC', 'yyyy-MM-dd') === valor;
}
