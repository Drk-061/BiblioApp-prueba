import { useSyncExternalStore } from 'react';
import type { ResultadoAccion, RolSesion, SolicitudBaja, SolicitudRegistroEncargado, UsuarioGestion } from '../types/usuarios';


type Estado = {
  usuarios: UsuarioGestion[];
  solicitudesBaja: SolicitudBaja[];
  solicitudesRegistro: SolicitudRegistroEncargado[];
  registroEncargadosHabilitado: boolean;
};

let estado: Estado = {
  usuarios: [
    {
      id: 'u1', nombre: 'Leodan Alexis López Mejía', matricula: 'A1933527',
      tipo: 'cliente', estado: 'Activo', prestamosActivos: 2, adeudoPendiente: 8,
    },
    {
      id: 'u2', nombre: 'María Hernández', matricula: 'E204512',
      tipo: 'encargado', estado: 'Activo', prestamosActivos: 0, adeudoPendiente: 0,
    },
    {
      id: 'u3', nombre: 'Carlos Pérez', matricula: 'A188452',
      tipo: 'cliente', estado: 'Inactivo', prestamosActivos: 0, adeudoPendiente: 0,
    },
    {
      id: 'u4', nombre: 'Diana Ruiz', matricula: 'A200789',
      tipo: 'cliente', estado: 'Activo', prestamosActivos: 0, adeudoPendiente: 0,
    },
    {
      id: 'u5', nombre: 'Jorge Ramírez', matricula: 'E205003',
      tipo: 'encargado', estado: 'Activo', prestamosActivos: 0, adeudoPendiente: 0,
    },
    {
      id: 'u6', nombre: 'Ana Morales', matricula: 'E205004',
      tipo: 'encargado', estado: 'Activo', prestamosActivos: 0, adeudoPendiente: 0,
    },
  ],
  solicitudesBaja: [],
  solicitudesRegistro: [
    {
      id: 'alta-1', nombre: 'Andrea Gómez Ruiz', matricula: 'E300015',
      fechaSolicitud: '2026-10-29T10:00:00.000Z', estado: 'Pendiente',
    },
    {
      id: 'alta-2', nombre: 'Luis Alberto Díaz', matricula: 'E300016',
      fechaSolicitud: '2026-10-29T11:00:00.000Z', estado: 'Pendiente',
    },
  ],
  registroEncargadosHabilitado: false,
};

const oyentes = new Set<() => void>();
const suscribir = (oyente: () => void) => {
  oyentes.add(oyente);
  return () => { oyentes.delete(oyente); };
};
const obtenerEstado = () => estado;
const publicar = (nuevo: Estado) => {
  estado = nuevo;
  oyentes.forEach((oyente) => oyente());
};

export function useUsuariosDemo() {
  return useSyncExternalStore(suscribir, obtenerEstado, obtenerEstado);
}

export function buscarUsuario(id: string) {
  return estado.usuarios.find((u) => u.id === id);
}

export function validarBaja(usuario: UsuarioGestion): string | null {
  if (usuario.estado === 'Inactivo') return 'Esta cuenta ya está dada de baja.';
  if (usuario.prestamosActivos > 0 || usuario.adeudoPendiente > 0) {
    return 'No es posible dar de baja. El usuario tiene operaciones pendientes.';
  }
  return null;
}

export function darBajaUsuario(id: string, rol: RolSesion): ResultadoAccion {
  const usuario = buscarUsuario(id);
  if (!usuario) return { ok: false, mensaje: 'Usuario no encontrado.' };
  if (rol === 'cliente' || (rol === 'encargado' && usuario.tipo === 'encargado')) {
    return { ok: false, mensaje: 'No tienes autorización para dar de baja esta cuenta.' };
  }
  const bloqueo = validarBaja(usuario);
  if (bloqueo) return { ok: false, mensaje: bloqueo };
  publicar({
    ...estado,
    usuarios: estado.usuarios.map((u) => u.id === id ? { ...u, estado: 'Inactivo' } : u),
  });
  return { ok: true, mensaje: 'La baja se realizó correctamente.' };
}

export function solicitarBajaEncargado(id: string, rol: RolSesion): ResultadoAccion {
  if (rol !== 'encargado') return { ok: false, mensaje: 'Solo un encargado puede enviar esta solicitud.' };
  const usuario = buscarUsuario(id);
  if (!usuario || usuario.tipo !== 'encargado') {
    return { ok: false, mensaje: 'El usuario seleccionado no es encargado.' };
  }
  const bloqueo = validarBaja(usuario);
  if (bloqueo) return { ok: false, mensaje: bloqueo };
  if (estado.solicitudesBaja.some((s) => s.usuarioId === id && s.estado === 'Pendiente')) {
    return { ok: false, mensaje: 'Ya existe una solicitud pendiente para este encargado.' };
  }
  const solicitud: SolicitudBaja = {
    id: `sol-${Date.now()}`,
    usuarioId: usuario.id,
    nombreUsuario: usuario.nombre,
    matricula: usuario.matricula,
    solicitanteId: 'ENCARGADO-DEMO',
    fechaSolicitud: new Date().toISOString(),
    estado: 'Pendiente',
  };
  publicar({ ...estado, solicitudesBaja: [...estado.solicitudesBaja, solicitud] });
  return { ok: true, mensaje: 'La solicitud fue enviada al administrador.' };
}

export function resolverSolicitudBaja(
  solicitudId: string,
  decision: 'Aprobada' | 'Rechazada',
  rol: RolSesion
): ResultadoAccion {
  if (rol !== 'admin') return { ok: false, mensaje: 'Solo el administrador puede responder solicitudes.' };
  const solicitud = estado.solicitudesBaja.find((s) => s.id === solicitudId);
  if (!solicitud || solicitud.estado !== 'Pendiente') {
    return { ok: false, mensaje: 'La solicitud no existe o ya fue revisada.' };
  }
  let usuarios = estado.usuarios;
  if (decision === 'Aprobada') {
    const usuario = buscarUsuario(solicitud.usuarioId);
    if (!usuario || usuario.tipo !== 'encargado') {
      return { ok: false, mensaje: 'No se encontró al encargado de esta solicitud.' };
    }
    const bloqueo = validarBaja(usuario);
    if (bloqueo) return { ok: false, mensaje: bloqueo };
    usuarios = usuarios.map((u) => u.id === usuario.id ? { ...u, estado: 'Inactivo' } : u);
  }
  publicar({
    ...estado,
    usuarios,
    solicitudesBaja: estado.solicitudesBaja.map((s) =>
      s.id === solicitudId ? { ...s, estado: decision, fechaRevision: new Date().toISOString() } : s
    ),
  });
  return { ok: true, mensaje: decision === 'Aprobada' ? 'Baja autorizada y aplicada.' : 'Solicitud rechazada.' };
}


export function registroEncargadoHabilitadoDemo(): boolean {
  return estado.registroEncargadosHabilitado;
}

export function cambiarRegistroEncargadosDemo(
  habilitado: boolean,
  rol: RolSesion
): ResultadoAccion {
  if (rol !== 'admin') {
    return { ok: false, mensaje: 'Solo un administrador puede modificar esta opción.' };
  }
  publicar({ ...estado, registroEncargadosHabilitado: habilitado });
  return { ok: true, mensaje: habilitado ? 'Registro de encargados habilitado.' : 'Registro de encargados deshabilitado.' };
}

export function crearSolicitudRegistroEncargadoDemo(
  matricula: string,
  nombre: string
): ResultadoAccion {
  if (!estado.registroEncargadosHabilitado) {
    return { ok: false, mensaje: 'El administrador deshabilitó el registro de encargados.' };
  }
  const clave = matricula.trim().toUpperCase();
  const nombreLimpio = nombre.trim();
  if (!clave || !nombreLimpio) return { ok: false, mensaje: 'Completa matrícula y nombre.' };
  if (estado.usuarios.some(u => u.matricula.toUpperCase() === clave)) {
    return { ok: false, mensaje: 'La matrícula ya existe en el sistema.' };
  }
  if (estado.solicitudesRegistro.some(s => s.matricula.toUpperCase() === clave && s.estado === 'Pendiente')) {
    return { ok: false, mensaje: 'Ya existe una solicitud pendiente para esa matrícula.' };
  }
  const solicitud: SolicitudRegistroEncargado = {
    id: `alta-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    nombre: nombreLimpio, matricula: clave,
    fechaSolicitud: new Date().toISOString(), estado: 'Pendiente',
  };
  publicar({ ...estado, solicitudesRegistro: [...estado.solicitudesRegistro, solicitud] });
  return { ok: true, mensaje: 'Solicitud recibida, pendiente de aprobación.' };
}

export function resolverSolicitudRegistroEncargadoDemo(
  id: string,
  decision: 'Aprobada' | 'Rechazada',
  rol: RolSesion
): ResultadoAccion {
  if (rol !== 'admin') return { ok: false, mensaje: 'Solo el administrador puede revisar solicitudes.' };
  const solicitud = estado.solicitudesRegistro.find(s => s.id === id);
  if (!solicitud || solicitud.estado !== 'Pendiente') {
    return { ok: false, mensaje: 'La solicitud ya fue revisada o no existe.' };
  }
  if (decision === 'Aprobada' && estado.usuarios.some(u => u.matricula.toUpperCase() === solicitud.matricula.toUpperCase())) {
    return { ok: false, mensaje: 'Ya existe una cuenta con esta matrícula.' };
  }
  const nuevoUsuario: UsuarioGestion = {
    id: `aprobado-${solicitud.id}`, matricula: solicitud.matricula,
    nombre: solicitud.nombre, tipo: 'encargado', estado: 'Activo',
    prestamosActivos: 0, adeudoPendiente: 0,
  };
  publicar({
    ...estado,
    usuarios: decision === 'Aprobada' ? [...estado.usuarios, nuevoUsuario] : estado.usuarios,
    solicitudesRegistro: estado.solicitudesRegistro.map(s => s.id === id
      ? { ...s, estado: decision, fechaRevision: new Date().toISOString() }
      : s),
  });
  return {
    ok: true,
    mensaje: decision === 'Aprobada'
      ? 'Solicitud aceptada. Se agregó el encargado a la lista DEMO, sin crear credenciales reales.'
      : 'Solicitud rechazada.',
  };
}
