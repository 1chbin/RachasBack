import { RachaPuntosService } from './racha-puntos.service';

describe('RachaPuntosService', () => {
  const service = new RachaPuntosService();

  it('calcula bonus y puntos según racha', () => {
    expect(service.calcularPuntosCheckIn(1)).toBe(10);
    expect(service.calcularPuntosCheckIn(3)).toBe(15);
    expect(service.calcularPuntosCheckIn(7)).toBe(20);
  });

  it('calcula mejor racha en días no consecutivos', () => {
    const dias = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06'];
    expect(service.calcularMejorRacha(dias)).toBe(2);
  });

  it('calcula racha en un día consecutivo', () => {
    const dias = ['2026-10-14', '2026-10-15', '2026-10-16'];
    expect(service.calcularRachaEnDia(dias, '2026-10-16')).toBe(3);
  });
});
