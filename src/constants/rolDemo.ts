import type { RolUsuario } from '../types/libros';

/** Compatibilidad temporal con las pantallas existentes.
 * El rol proviene de SessionContext, NO de un selector manual.
 * La autorización de operaciones sigue siendo responsabilidad de Node.js.
 */
let rolSesion: RolUsuario | null = null;

/** No asigna privilegios; solo define qué interfaz se muestra. */
export function setRolSesion(rol: RolUsuario | null): void {
  rolSesion = rol;
}

/** Conservada para que no fallen importaciones antiguas que usan ROL_DEMO. */
export const ROL_DEMO: RolUsuario = 'cliente';

export function obtenerRolDemo(): RolUsuario {
  return rolSesion ?? ROL_DEMO;
}

export function puedeGestionarBiblioteca(rol: RolUsuario): boolean {
  return rol === 'encargado' || rol === 'admin';
}
