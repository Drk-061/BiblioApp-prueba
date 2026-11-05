export const CATEGORIAS = [
  'Matemáticas', 'Ciencias', 'Programación', 'Literatura', 'Historia', 'Otros',
] as const;

export type CategoriaLibro = (typeof CATEGORIAS)[number];
export type RolUsuario = 'cliente' | 'encargado'|'admin' ;
export type EstadoEjemplar = 'Disponible' | 'Prestado' | 'Extraviado' | 'Dañado';

/** Ficha bibliográfica. La disponibilidad se calcula a partir de los ejemplares. */
export type Libro = {
  id: string;
  isbn: string;
  titulo: string;
  autor: string;
  editorial: string;
  edicion: string;
  anioPublicacion: number;
  idioma: string;
  numeroPaginas: number;
  categoria: CategoriaLibro;
  palabrasClave: string[];
  ejemplaresDisponibles: number;
  registradoEn: string;
  activo: boolean;
};

export type DatosLibroNuevo = Omit<Libro, 'id' | 'registradoEn' | 'ejemplaresDisponibles' | 'activo'>;
export type DatosLibroEditado = DatosLibroNuevo;

export type Ejemplar = {
  id: string;
  libroId: string;
  clave: string;
  codigoBarras: string;
  codigoQr: string;
  ubicacion: string;
  estado: EstadoEjemplar;
  registradoEn: string;
};

export type DatosEjemplarNuevo = Pick<Ejemplar, 'libroId' | 'clave' | 'codigoBarras' | 'ubicacion'>;
export type DatosEjemplarEditado = Pick<Ejemplar, 'codigoBarras' | 'ubicacion' | 'estado'>;

export type ResumenEjemplares = { total: number; disponibles: number };
