import type { PrestamoRegistro } from '../context/PrestamosContext';

export function multasDeUsuario(
  prestamos: PrestamoRegistro[],
  matricula: string
): PrestamoRegistro[] {
  return prestamos.filter(
    (p) => p.matricula === matricula && p.multa != null
  );
}

export function totalAdeudosPendientes(
  prestamos: PrestamoRegistro[],
  matricula: string
): number {
  return multasDeUsuario(prestamos, matricula).reduce((total, prestamo) => {
    const multa = prestamo.multa;
    return total + (multa?.estado === 'Pendiente' ? multa.monto : 0);
  }, 0);
}
