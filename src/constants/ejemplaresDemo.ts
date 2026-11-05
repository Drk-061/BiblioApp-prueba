import type { Ejemplar, EstadoEjemplar } from '../types/libros';

// Datos demostrativos. Cada copia física tiene una clave única.
function crear(libroId: string, clave: string, estado: EstadoEjemplar, ubicacion = 'Estante A-03'): Ejemplar {
  return {
    id: `ej-${clave}`,
    libroId,
    clave,
    codigoBarras: `002${clave.replace(/[^0-9]/g, '').padStart(6, '0')}`,
    codigoQr: JSON.stringify({ tipo: 'ejemplar', codigoEjemplar: clave }),
    ubicacion,
    estado,
    registradoEn: '2026-10-01T10:00:00.000Z',
  };
}

export const ejemplaresIniciales: Ejemplar[] = [
  crear('lib-001', 'EJ-001', 'Disponible'),
  crear('lib-001', 'EJ-002', 'Prestado'),
  crear('lib-001', 'EJ-003', 'Extraviado'),
  crear('lib-001', 'EJ-004', 'Dañado'),
  crear('lib-001', 'EJ-005', 'Disponible', 'Estante B-04'),
  crear('lib-001', 'EJ-006', 'Disponible', 'Estante B-04'),
  crear('lib-002', 'EJ-007', 'Disponible'),
  crear('lib-002', 'EJ-008', 'Disponible'),
  crear('lib-003', 'EJ-009', 'Disponible'),
  crear('lib-004', 'EJ-010', 'Disponible'),
  crear('lib-004', 'EJ-011', 'Disponible'),
  crear('lib-004', 'EJ-012', 'Disponible'),
  crear('lib-004', 'EJ-013', 'Disponible'),
  crear('lib-006', 'EJ-014', 'Disponible'),
  crear('lib-006', 'EJ-015', 'Disponible'),
];
