import type { RolUsuario } from '../types/libros';

let rolSesion: RolUsuario | null = null;

export function setRolSesion(rol: RolUsuario | null): void {
  rolSesion = rol;
}

export const ROL_DEMO: RolUsuario = 'cliente';

export function obtenerRolDemo(): RolUsuario {
  return rolSesion ?? ROL_DEMO;
}

export function puedeGestionarBiblioteca(rol: RolUsuario): boolean {
  return rol === 'encargado' || rol === 'admin';
}
