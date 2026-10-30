export const REALTIME_EVENT = {
  DESAFIO_SUSCRIBIR: 'desafio:suscribir',
  DESAFIO_DESUSCRIBIR: 'desafio:desuscribir',
  CHECKIN_REGISTRADO: 'checkin:registrado',
  CHECKIN_DESHECHO: 'checkin:deshecho',
  RANKING_ACTUALIZADO: 'ranking:actualizado',
  PARTICIPANTE_UNIDO: 'participante:unido',
  PARTICIPANTE_ABANDONO: 'participante:abandono',
  DESAFIO_CANCELADO: 'desafio:cancelado',
  ALIENTO_ENVIAR: 'aliento:enviar',
  ALIENTO_RECIBIDO: 'aliento:recibido',
} as const;

export function salaDesafio(desafioId: string): string {
  return `desafio:${desafioId}`;
}
