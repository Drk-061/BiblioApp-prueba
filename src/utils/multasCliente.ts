import type { PrestamoRegistro } from '../context/PrestamosContext';

/** Las multas se consultan desde el mismo contexto de Préstamos. */
export function multasDeUsuario(
  prestamos: PrestamoRegistro[],
  matricula: string
): PrestamoRegistro[] {
  return prestamos.filter(
    (p) => p.matricula === matricula && p.multa != null
  );
}

/** Solo las multas pendientes contribuyen al adeudo del menú. */
export function totalAdeudosPendientes(
  prestamos: PrestamoRegistro[],
  matricula: string
): number {
  return multasDeUsuario(prestamos, matricula).reduce((total, prestamo) => {
    const multa = prestamo.multa;
    return total + (multa?.estado === 'Pendiente' ? multa.monto : 0);
  }, 0);
}
