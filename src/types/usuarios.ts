export type RolSesion = 'admin' | 'encargado' | 'cliente';
export type TipoUsuario = 'cliente' | 'encargado';
export type EstadoUsuario = 'Activo' | 'Inactivo';

export interface UsuarioGestion {
  id: string;
  nombre: string;
  matricula: string;
  tipo: TipoUsuario;
  estado: EstadoUsuario;
  prestamosActivos: number;
  adeudoPendiente: number;
}

export interface SolicitudBaja {
  id: string;
  usuarioId: string;
  nombreUsuario: string;
  matricula: string;
  solicitanteId: string;
  fechaSolicitud: string;
  fechaRevision?: string;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
}

export type ResultadoAccion =
  | { ok: true; mensaje: string }
  | { ok: false; mensaje: string };

/** Solicitud de alta de Encargado. Todavía no permite iniciar sesión. */
export interface SolicitudRegistroEncargado {
  id: string;
  nombre: string;
  matricula: string;
  fechaSolicitud: string;
  fechaRevision?: string;
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada';
}
