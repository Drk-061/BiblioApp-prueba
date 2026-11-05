import type { LibroAPI, PrestamoAPI } from './api';
import { CATEGORIAS, type CategoriaLibro, type Libro } from '../types/libros';

const CATEGORIA_API: Record<string, string> = {
  MATEMATICAS: 'Matemáticas',
  CIENCIAS: 'Ciencias',
  PROGRAMACION: 'Programación',
  LITERATURA: 'Literatura',
  HISTORIA: 'Historia',
  OTROS: 'Otros',
};

export function convertirLibro(libro: LibroAPI): Libro {
  const categoria = CATEGORIA_API[String(libro.categoria ?? '').toUpperCase()] ?? 'Otros';
  const categoriaVisible: CategoriaLibro = CATEGORIAS.includes(categoria as CategoriaLibro)
    ? categoria as CategoriaLibro
    : 'Otros';

  return {
    id: libro.id,
    isbn: libro.isbn ?? '',
    titulo: libro.titulo ?? '',
    autor: libro.autor ?? '',
    editorial: libro.editorial ?? '',
    edicion: libro.edicion ?? '',
    anioPublicacion: Number(libro.anioPublicacion ?? 0),
    idioma: libro.idioma ?? 'Español',
    numeroPaginas: Number(libro.numeroPaginas ?? 0),
    categoria: categoriaVisible,
    palabrasClave: [], 
    ejemplaresDisponibles: Number(libro.ejemplaresDisponibles ?? 0),
    registradoEn: '', 
  };
}

export function fechaCorta(valor: string | null | undefined): string {
  if (!valor) return '—';
  const texto = String(valor);
  const fecha = texto.slice(0, 10);
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (coincidencia) return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`;
  return texto;
}

export type FilaPrestamo = {
  id: string;
  detalleId: number;
  matricula: string;
  nombreUsuario: string;
  fechaPrestamo: string;
  fechaLimite: string;
  fechaDevolucion: string | null;
  titulo: string;
  autor: string;
  codigoEjemplar: string;
  estado: string;
  estadoEjemplar: string;
};

export function filasPrestamos(prestamos: PrestamoAPI[]): FilaPrestamo[] {
  return prestamos.flatMap((prestamo) =>
    (prestamo.ejemplares ?? []).map((ejemplar) => ({
      id: prestamo.id,
      detalleId: ejemplar.detalleId,
      matricula: prestamo.matricula,
      nombreUsuario: prestamo.nombreUsuario,
      fechaPrestamo: prestamo.fechaPrestamo,
      fechaLimite: prestamo.fechaLimite,
      fechaDevolucion: ejemplar.fechaDevolucion ?? null,
      titulo: ejemplar.titulo,
      autor: ejemplar.autor,
      codigoEjemplar: ejemplar.codigo,
      estado: prestamo.estado,
      estadoEjemplar: ejemplar.estado,
    }))
  );
}
