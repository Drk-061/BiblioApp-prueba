import { usuarioDemo } from './usuarioDemo';

export type EtiquetaHistorial = 'Devuelto' | 'Con multa' | 'Renovado' | 'Con incidencia';
export type EstadoPrestamoHistorial = 'Activo' | 'Devuelto';

export type MultaHistorial = {
  id: string;
  motivo: string;
  monto: number;
  estado: 'Pendiente' | 'Pagada';
  fecha: string;
};

export type IncidenciaHistorial = {
  id: string;
  motivo: string;
  fecha: string;
  estado: 'Abierta' | 'En proceso' | 'Resuelta';
};

export type RegistroHistorial = {
  id: string;
  prestamoId: string;
  usuario: { nombre: string; matricula: string };
  libro: { titulo: string; autor: string; ejemplar: string };
  fechaPrestamo: string; // AAAA-MM-DD
  fechaLimite: string;
  fechaDevolucion: string | null;
  estadoPrestamo: EstadoPrestamoHistorial;
  renovaciones: number;
  etiqueta: EtiquetaHistorial;
  multa: MultaHistorial | null;
  incidencia: IncidenciaHistorial | null;
};

const yo = { nombre: usuarioDemo.nombreCompleto, matricula: usuarioDemo.matricula };

export const HISTORIAL_DEMO: RegistroHistorial[] = [
  {
    id: 'his-001', prestamoId: 'PRE-001', usuario: yo,
    libro: { titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', ejemplar: 'EJ-003' },
    fechaPrestamo: '2026-10-04', fechaLimite: '2026-10-07', fechaDevolucion: '2026-10-07',
    estadoPrestamo: 'Devuelto', renovaciones: 0, etiqueta: 'Devuelto', multa: null, incidencia: null,
  },
  {
    id: 'his-002', prestamoId: 'PRE-002', usuario: yo,
    libro: { titulo: 'Base de Datos', autor: 'Equipo editorial', ejemplar: 'EJ-011' },
    fechaPrestamo: '2026-10-01', fechaLimite: '2026-10-10', fechaDevolucion: '2026-10-12',
    estadoPrestamo: 'Devuelto', renovaciones: 0, etiqueta: 'Con multa',
    multa: { id: 'MUL-002', motivo: 'Retraso en devolución', monto: 8, estado: 'Pagada', fecha: '2026-10-12' },
    incidencia: null,
  },
  {
    id: 'his-003', prestamoId: 'PRE-003', usuario: yo,
    libro: { titulo: 'Programación', autor: 'Equipo editorial', ejemplar: 'EJ-007' },
    fechaPrestamo: '2026-10-08', fechaLimite: '2026-10-14', fechaDevolucion: '2026-10-14',
    estadoPrestamo: 'Devuelto', renovaciones: 1, etiqueta: 'Renovado', multa: null, incidencia: null,
  },
  {
    id: 'his-004', prestamoId: 'PRE-004', usuario: yo,
    libro: { titulo: 'Programación', autor: 'Equipo editorial', ejemplar: 'EJ-009' },
    fechaPrestamo: '2026-10-15', fechaLimite: '2026-10-30', fechaDevolucion: null,
    estadoPrestamo: 'Activo', renovaciones: 0, etiqueta: 'Con incidencia', multa: null,
    incidencia: { id: 'INC-004', motivo: 'Extravío reportado', fecha: '2026-10-18', estado: 'Resuelta' },
  },
  {
    id: 'his-005', prestamoId: 'PRE-005',
    usuario: { nombre: 'Leodan López', matricula: 'A1933527' },
    libro: { titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry', ejemplar: 'EJ-013' },
    fechaPrestamo: '2026-10-04', fechaLimite: '2026-10-07', fechaDevolucion: '2026-10-07',
    estadoPrestamo: 'Devuelto', renovaciones: 0, etiqueta: 'Devuelto', multa: null, incidencia: null,
  },
  {
    id: 'his-006', prestamoId: 'PRE-006',
    usuario: { nombre: 'Gustavo Jomapa', matricula: 'A1933558' },
    libro: { titulo: 'Base de Datos', autor: 'Equipo editorial', ejemplar: 'EJ-015' },
    fechaPrestamo: '2026-10-01', fechaLimite: '2026-10-10', fechaDevolucion: '2026-10-12',
    estadoPrestamo: 'Devuelto', renovaciones: 0, etiqueta: 'Con multa',
    multa: { id: 'MUL-006', motivo: 'Retraso en devolución', monto: 8, estado: 'Pagada', fecha: '2026-10-12' },
    incidencia: null,
  },
  {
    id: 'his-007', prestamoId: 'PRE-007',
    usuario: { nombre: 'Luis Alonso de la Cruz', matricula: 'A1933559' },
    libro: { titulo: 'Programación', autor: 'Equipo editorial', ejemplar: 'EJ-001' },
    fechaPrestamo: '2026-10-15', fechaLimite: '2026-10-30', fechaDevolucion: null,
    estadoPrestamo: 'Activo', renovaciones: 0, etiqueta: 'Con incidencia', multa: null,
    incidencia: { id: 'INC-007', motivo: 'Extravío reportado', fecha: '2026-10-18', estado: 'Resuelta' },
  },
];

export function fechaCorta(fecha: string | null): string {
  if (!fecha) return 'Pendiente';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

export function historialVisible(rol: 'cliente' | 'encargado' | 'admin') {
  return rol === 'cliente'
    ? HISTORIAL_DEMO.filter((r) => r.usuario.matricula === usuarioDemo.matricula)
    : HISTORIAL_DEMO;
}
