export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
export type Rol = 'cliente' | 'encargado' | 'admin';
export type Usuario = {
  matricula: string; nombres: string; apellidoPaterno: string; apellidoMaterno: string | null;
  correo: string; nombre: string; rol: Rol; estado: string;
};
export type LibroAPI = {
  id: string; isbn: string | null; titulo: string; autor: string; editorial: string | null;
  edicion: string | null; anioPublicacion: number | null; numeroPaginas: number | null;
  idioma: string; categoria: string; ejemplaresDisponibles: number; ejemplaresTotales?: number;
};
export type EjemplarAPI = { codigo: string; qr: string; estado: string; ubicacion: string | null; codigoBarras: string | null };
export type PrestamoAPI = {
  id: string; matricula: string; nombreUsuario: string; fechaPrestamo: string;
  fechaLimite: string; estado: string; renovaciones?:number;
  ejemplares: Array<{detalleId:number; codigo:string;titulo:string;autor:string;estado:string;fechaDevolucion:string|null}>;
};
// El secreto JWT y la contraseña MySQL no se guardan en el frontend.
export async function pedirAPI<T>(ruta: string, opciones: RequestInit = {}, token?: string | null): Promise<T> {
  if (!API_URL) throw new Error('Configura EXPO_PUBLIC_API_URL en el archivo .env de Expo.');
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        Accept: 'application/json',
        ...(opciones.body ? {'Content-Type': 'application/json'} : {}),
        ...(token ? {Authorization:`Bearer ${token}`} : {}),
        ...opciones.headers,
      },
    });
  } catch {
    throw new Error('No se pudo conectar a Node.js. Comprueba la IP del equipo y la conexión Wi-Fi.');
  }
  const raw = await respuesta.text();
  let datos: any = {};
  try { datos = raw ? JSON.parse(raw) : {}; } catch { /* respuesta no JSON */ }
  if(!respuesta.ok) throw new Error(datos.mensaje || `Error HTTP ${respuesta.status}`);
  return datos as T;
}
