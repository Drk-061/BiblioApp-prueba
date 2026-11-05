import { createContext, useContext, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { ejemplaresIniciales } from '../constants/ejemplaresDemo';
import { librosIniciales } from '../constants/librosDemo';
import { obtenerRolDemo } from '../constants/rolDemo';
import type {
  DatosEjemplarEditado, DatosEjemplarNuevo, DatosLibroEditado,
  DatosLibroNuevo, Ejemplar, Libro, ResumenEjemplares,
} from '../types/libros';

function resumen(ejemplares: Ejemplar[], libroId: string): ResumenEjemplares {
  const delLibro = ejemplares.filter((e) => e.libroId === libroId);
  return {
    total: delLibro.length,
    disponibles: delLibro.filter((e) => e.estado === 'Disponible').length,
  };
}

export function generarValorQR(clave: string): string {
  return JSON.stringify({ tipo: 'ejemplar', codigoEjemplar: clave });
}

type Contexto = {
  libros: Libro[];
  ejemplares: Ejemplar[];
  registrarLibro: (datos: DatosLibroNuevo) => Libro;
  editarLibro: (id: string, datos: DatosLibroEditado) => boolean;
  darDeBajaLibro: (id: string) => boolean;
  obtenerLibro: (id: string) => Libro | undefined;
  obtenerEjemplares: (libroId: string) => Ejemplar[];
  obtenerResumen: (libroId: string) => ResumenEjemplares;
  registrarEjemplar: (datos: DatosEjemplarNuevo) => { ok: boolean; mensaje: string };
  editarEjemplar: (id: string, datos: DatosEjemplarEditado) => { ok: boolean; mensaje: string };
};

const LibrosContext = createContext<Contexto | null>(null);
const esEncargado = () => obtenerRolDemo() === 'encargado';

export function LibrosProvider({ children }: PropsWithChildren) {
  const [fichas, setFichas] = useState<Libro[]>(librosIniciales);
  const [ejemplares, setEjemplares] = useState<Ejemplar[]>(ejemplaresIniciales);

  const libros = useMemo(() => fichas.map((libro) => ({
    ...libro,
    ejemplaresDisponibles: resumen(ejemplares, libro.id).disponibles,
  })), [fichas, ejemplares]);

  const value = useMemo<Contexto>(() => ({
    libros,
    ejemplares,
    registrarLibro: (datos) => {
      if (!esEncargado()) throw new Error('Sin autorización para registrar libros');
      const libro: Libro = {
        ...datos,
        id: `lib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ejemplaresDisponibles: 0,
        registradoEn: new Date().toISOString(),
        activo: true,
      };
      setFichas((prev) => [libro, ...prev]);
      return libro;
    },
    editarLibro: (id, datos) => {
      if (!esEncargado() || !fichas.some((l) => l.id === id && l.activo)) return false;
      const isbn = datos.isbn.replace(/[\s-]/g, '').toUpperCase();
      if (fichas.some((l) => l.id !== id && l.isbn.replace(/[\s-]/g, '').toUpperCase() === isbn)) return false;
      setFichas((prev) => prev.map((l) => l.id === id ? { ...l, ...datos } : l));
      return true;
    },
    darDeBajaLibro: (id) => {
      if (!esEncargado() || !fichas.some((l) => l.id === id && l.activo)) return false;
      setFichas((prev) => prev.map((l) => l.id === id ? { ...l, activo: false } : l));
      return true;
    },
    obtenerLibro: (id) => libros.find((l) => l.id === id),
    obtenerEjemplares: (libroId) => ejemplares.filter((e) => e.libroId === libroId),
    obtenerResumen: (libroId) => resumen(ejemplares, libroId),
    registrarEjemplar: (datos) => {
      if (!esEncargado()) return { ok: false, mensaje: 'Solo un encargado puede registrar ejemplares.' };
      if (!fichas.some((l) => l.id === datos.libroId && l.activo)) return { ok: false, mensaje: 'El libro ya no está activo.' };
      const clave = datos.clave.trim().toUpperCase();
      const barras = datos.codigoBarras.trim();
      const ubicacion = datos.ubicacion.trim();
      if (!clave || !barras || !ubicacion) return { ok: false, mensaje: 'Completa clave, barras y ubicación.' };
      if (!/^[A-Z0-9-]{3,30}$/.test(clave)) return { ok: false, mensaje: 'La clave solo puede contener letras, números y guiones (3 a 30 caracteres).' };
      if (ejemplares.some((e) => e.clave.toUpperCase() === clave)) return { ok: false, mensaje: 'Ya existe un ejemplar con esa clave.' };
      if (ejemplares.some((e) => e.codigoBarras === barras)) return { ok: false, mensaje: 'Ya existe ese código de barras.' };
      const nuevo: Ejemplar = {
        ...datos, clave, codigoBarras: barras, ubicacion,
        id: `ej-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        codigoQr: generarValorQR(clave),
        estado: 'Disponible',
        registradoEn: new Date().toISOString(),
      };
      setEjemplares((prev) => [...prev, nuevo]);
      return { ok: true, mensaje: 'Ejemplar agregado correctamente.' };
    },
    editarEjemplar: (id, datos) => {
      if (!esEncargado()) return { ok: false, mensaje: 'Acceso restringido.' };
      const actual = ejemplares.find((e) => e.id === id);
      if (!actual || !fichas.some((l) => l.id === actual.libroId && l.activo)) return { ok: false, mensaje: 'Ejemplar no disponible.' };
      const barras = datos.codigoBarras.trim();
      const ubicacion = datos.ubicacion.trim();
      if (!barras || !ubicacion) return { ok: false, mensaje: 'Completa el código de barras y la ubicación.' };
      if (ejemplares.some((e) => e.id !== id && e.codigoBarras === barras)) return { ok: false, mensaje: 'El código de barras ya está registrado.' };
      setEjemplares((prev) => prev.map((e) => e.id === id ? { ...e, ...datos, codigoBarras: barras, ubicacion } : e));
      return { ok: true, mensaje: 'Ejemplar actualizado.' };
    },
  }), [libros, ejemplares, fichas]);

  return <LibrosContext.Provider value={value}>{children}</LibrosContext.Provider>;
}

export function useLibros() {
  const value = useContext(LibrosContext);
  if (!value) throw new Error('Envuelve el Stack con LibrosProvider en _layout.tsx');
  return value;
}
