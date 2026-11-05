import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { usuarioDemo } from '../constants/usuarioDemo';

export type EstadoPrestamo = 'Activo' | 'Devuelto';
export type Multa = {
  id: string;
  motivo: string;
  diasRetraso: number;
  monto: number;
  estado: 'Pendiente' | 'Pagada';
  fechaEmision: string;
  fechaPago?: string;
};
export type Incidencia = {
  descripcion: string;
  fechaReporte: string;
  estado: 'Pendiente de revisión' | 'En seguimiento' | 'Resuelta';
  observaciones?: string;
  fechaResolucion?: string;
};
export type PrestamoRegistro = {
  id: string;
  titulo: string;
  autor: string;
  categoria: string;
  codigoEjemplar: string;
  matricula: string;
  nombreUsuario: string;
  fechaPrestamo: string; // ISO YYYY-MM-DD, sin zona horaria
  fechaLimite: string;
  fechaDevolucion?: string;
  estado: EstadoPrestamo;
  renovaciones: number;
  multa?: Multa;
  incidencia?: Incidencia;
};
export type ResultadoOperacion = { ok: boolean; mensaje: string };

export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function sumarDiasISO(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia + dias, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function fechaVisible(fecha?: string): string {
  if (!fecha) return 'Sin registrar';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}
export function estaVencido(p: PrestamoRegistro): boolean {
  return p.estado === 'Activo' && p.fechaLimite < hoyISO();
}
export function puedeRenovar(p: PrestamoRegistro): boolean {
  return p.estado === 'Activo' && !estaVencido(p) && p.renovaciones < 1 &&
    !p.incidencia && p.multa?.estado !== 'Pendiente';
}

// Se calculan con fechas relativas para que las pruebas funcionen cualquier día.
function datosIniciales(): PrestamoRegistro[] {
  const hoy = hoyISO();
  return [
    {
      id: 'p1', titulo: 'El Principito', autor: 'Antoine de Saint-Exupéry',
      categoria: 'Literatura', codigoEjemplar: 'EJ-003',
      matricula: usuarioDemo.matricula, nombreUsuario: usuarioDemo.nombreCompleto,
      fechaPrestamo: sumarDiasISO(hoy, -1), fechaLimite: sumarDiasISO(hoy, 2),
      estado: 'Activo', renovaciones: 0,
    },
    {
      id: 'p2', titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez',
      categoria: 'Novela', codigoEjemplar: 'EJ-014',
      matricula: 'A1933527', nombreUsuario: 'Leodan López',
      fechaPrestamo: sumarDiasISO(hoy, -2), fechaLimite: sumarDiasISO(hoy, 1),
      estado: 'Activo', renovaciones: 0,
    },
    {
      id: 'p3', titulo: 'Pedro Páramo', autor: 'Juan Rulfo',
      categoria: 'Literatura', codigoEjemplar: 'EJ-009',
      matricula: usuarioDemo.matricula, nombreUsuario: usuarioDemo.nombreCompleto,
      fechaPrestamo: sumarDiasISO(hoy, -9), fechaLimite: sumarDiasISO(hoy, -5),
      estado: 'Activo', renovaciones: 0,
      multa: {
        id: 'M-001', motivo: 'Retraso en la devolución', diasRetraso: 5,
        monto: 8, estado: 'Pendiente', fechaEmision: hoy,
      },
    },
    {
      id: 'p4', titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes',
      categoria: 'Clásicos', codigoEjemplar: 'EJ-021',
      matricula: 'A1933527', nombreUsuario: 'Leodan López',
      fechaPrestamo: sumarDiasISO(hoy, -7), fechaLimite: sumarDiasISO(hoy, -4),
      fechaDevolucion: sumarDiasISO(hoy, -4), estado: 'Devuelto', renovaciones: 0,
    },
    {
      id: 'p5', titulo: 'Introducción a la Programación', autor: 'Autores de demostración',
      categoria: 'Programación', codigoEjemplar: 'EJ-030',
      matricula: 'A188452', nombreUsuario: 'Leodan Lopez',
      fechaPrestamo: sumarDiasISO(hoy, -4), fechaLimite: sumarDiasISO(hoy, 2),
      estado: 'Activo', renovaciones: 0,
      incidencia: {
        descripcion: 'Se reportó la pérdida del ejemplar durante el traslado.',
        fechaReporte: sumarDiasISO(hoy, -1), estado: 'En seguimiento',
        observaciones: 'En espera de confirmación por biblioteca.',
      },
    },
  ];
}

type PrestamosContexto = {
  prestamos: PrestamoRegistro[];
  obtenerPrestamo: (id: string) => PrestamoRegistro | undefined;
  renovarPrestamo: (id: string) => ResultadoOperacion;
  reportarExtravio: (id: string, descripcion: string) => ResultadoOperacion;
  devolverPrestamo: (id: string) => ResultadoOperacion;
  marcarMultaPagada: (id: string) => ResultadoOperacion;
  actualizarSeguimiento: (
    id: string,
    estado: 'Pendiente de revisión' | 'En seguimiento' | 'Resuelta',
    observaciones: string
  ) => ResultadoOperacion;
};
const Contexto = createContext<PrestamosContexto | undefined>(undefined);

export function PrestamosProvider({ children }: { children: ReactNode }) {
  const [prestamos, setPrestamos] = useState<PrestamoRegistro[]>(datosIniciales);

  const valor = useMemo<PrestamosContexto>(() => ({
    prestamos,
    obtenerPrestamo: (id) => prestamos.find(p => p.id === id),
    renovarPrestamo: (id) => {
      const p = prestamos.find(item => item.id === id);
      if (!p) return { ok: false, mensaje: 'El préstamo no existe.' };
      if (!puedeRenovar(p)) return { ok: false, mensaje: 'El préstamo no cumple las condiciones de renovación.' };
      setPrestamos(prev => prev.map(item => item.id === id ? {
        ...item, fechaLimite: sumarDiasISO(item.fechaLimite, 3), renovaciones: item.renovaciones + 1,
      } : item));
      return { ok: true, mensaje: 'La renovación de demostración se aplicó correctamente.' };
    },
    reportarExtravio: (id, descripcion) => {
      const p = prestamos.find(item => item.id === id);
      if (!p) return { ok: false, mensaje: 'El préstamo no existe.' };
      if (p.estado !== 'Activo' || p.incidencia) {
        return { ok: false, mensaje: 'El préstamo no permite registrar otra incidencia.' };
      }
      if (descripcion.trim().length < 10) {
        return { ok: false, mensaje: 'Explica lo sucedido en al menos 10 caracteres.' };
      }
      setPrestamos(prev => prev.map(item => item.id === id ? {
        ...item, incidencia: {
          descripcion: descripcion.trim(), fechaReporte: hoyISO(), estado: 'Pendiente de revisión',
        },
      } : item));
      return { ok: true, mensaje: 'El reporte se guardó en memoria (demostración).' };
    },
    marcarMultaPagada: (id) => {
      const p = prestamos.find(item => item.id === id);
      if (!p?.multa) return { ok: false, mensaje: 'Este préstamo no tiene multa.' };
      if (p.multa.estado === 'Pagada') return { ok: false, mensaje: 'La multa ya está pagada.' };
      setPrestamos(prev => prev.map(item => item.id === id ? {
        ...item,
        multa: item.multa ? { ...item.multa, estado: 'Pagada' as const, fechaPago: hoyISO() } : undefined,
      } : item));
      return { ok: true, mensaje: 'La multa se marcó como pagada (demostración).' };
    },
    actualizarSeguimiento: (id, estado, observaciones) => {
      const p = prestamos.find(item => item.id === id);
      if (!p?.incidencia) return { ok: false, mensaje: 'No existe una incidencia para este préstamo.' };
      if (estado === 'Resuelta' && observaciones.trim().length < 10) {
        return { ok: false, mensaje: 'Describe la resolución con al menos 10 caracteres.' };
      }
      if (p.incidencia.estado === 'Resuelta') {
        return { ok: false, mensaje: 'La incidencia ya está resuelta.' };
      }
      setPrestamos(prev => prev.map(item => item.id === id ? {
        ...item,
        incidencia: item.incidencia ? {
          ...item.incidencia,
          estado,
          observaciones: observaciones.trim(),
          fechaResolucion: estado === 'Resuelta' ? hoyISO() : undefined,
        } : undefined,
      } : item));
      return { ok: true, mensaje: 'Seguimiento actualizado (demostración).' };
    },
    devolverPrestamo: (id) => {
      const p = prestamos.find(item => item.id === id);
      if (!p || p.estado !== 'Activo') return { ok: false, mensaje: 'Este préstamo ya no está activo.' };
      if (p.incidencia && p.incidencia.estado !== 'Resuelta') {
        return { ok: false, mensaje: 'Primero se debe resolver la incidencia.' };
      }
      setPrestamos(prev => prev.map(item => item.id === id ? {
        ...item, estado: 'Devuelto', fechaDevolucion: hoyISO(),
      } : item));
      return { ok: true, mensaje: 'Devolución registrada en la demostración.' };
    },
  }), [prestamos]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePrestamos() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('PrestamosProvider debe envolver el Stack de Expo Router.');
  return contexto;
}
