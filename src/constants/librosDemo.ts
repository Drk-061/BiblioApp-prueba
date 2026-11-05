import type { Libro } from '../types/libros';

export const librosIniciales: Libro[] = [
  {
    id: 'lib-001', isbn: '9780156012195', titulo: 'El Principito',
    autor: 'Antoine de Saint-Exupéry', editorial: 'Harcourt',
    edicion: '1', anioPublicacion: 2000, idioma: 'Español', numeroPaginas: 96,
    categoria: 'Literatura', palabrasClave: ['novela', 'clásico', 'principito'],
    ejemplaresDisponibles: 3, activo: true, registradoEn: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'lib-002', isbn: '9780134685991', titulo: 'Effective Java',
    autor: 'Joshua Bloch', editorial: 'Addison-Wesley', edicion: '3',
    anioPublicacion: 2018, idioma: 'Inglés', numeroPaginas: 416,
    categoria: 'Programación', palabrasClave: ['java', 'software'],
    ejemplaresDisponibles: 2, activo: true, registradoEn: '2026-10-01T11:00:00.000Z',
  },
  {
    id: 'lib-003', isbn: '9780132350884', titulo: 'Código limpio',
    autor: 'Robert C. Martin', editorial: 'Prentice Hall', edicion: '1',
    anioPublicacion: 2008, idioma: 'Español', numeroPaginas: 464,
    categoria: 'Programación', palabrasClave: ['código', 'software'],
    ejemplaresDisponibles: 1, activo: true, registradoEn: '2026-10-01T12:00:00.000Z',
  },
  {
    id: 'lib-004', isbn: '9786071502913', titulo: 'Álgebra lineal',
    autor: 'Gilbert Strang', editorial: 'McGraw-Hill', edicion: '1',
    anioPublicacion: 2010, idioma: 'Español', numeroPaginas: 496,
    categoria: 'Matemáticas', palabrasClave: ['matrices', 'álgebra'],
    ejemplaresDisponibles: 4, activo: true, registradoEn: '2026-10-01T13:00:00.000Z',
  },
  {
    id: 'lib-005', isbn: '9788420688542', titulo: 'Breve historia del tiempo',
    autor: 'Stephen Hawking', editorial: 'Alianza', edicion: '1',
    anioPublicacion: 1988, idioma: 'Español', numeroPaginas: 256,
    categoria: 'Ciencias', palabrasClave: ['universo', 'física'],
    ejemplaresDisponibles: 0, activo: true, registradoEn: '2026-10-01T14:00:00.000Z',
  },
  {
    id: 'lib-006', isbn: '9788497592208', titulo: 'Sapiens',
    autor: 'Yuval Noah Harari', editorial: 'Debate', edicion: '1',
    anioPublicacion: 2014, idioma: 'Español', numeroPaginas: 496,
    categoria: 'Historia', palabrasClave: ['humanidad', 'historia'],
    ejemplaresDisponibles: 2, activo: true, registradoEn: '2026-10-01T15:00:00.000Z',
  },
];
