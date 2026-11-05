import {pedirAPI} from './api';
export type TipoRegistro='cliente'|'encargado';
export type NuevoUsuario={tipoUsuario:'CLIENTE'|'ENCARGADO';matricula:string;nombres:string;apellidoPaterno:string;apellidoMaterno:string;correo:string;contrasena:string};
export type ResultadoRegistro={modoDemo:false;estado:'REGISTRADO'|'PENDIENTE_APROBACION'};
export async function consultarDisponibilidadEncargado():Promise<boolean>{
 const r=await pedirAPI<{habilitado:boolean}>('/api/registro/encargados/disponibilidad');return r.habilitado;
}
export async function solicitarRegistro(datos:NuevoUsuario):Promise<ResultadoRegistro>{
 const r=await pedirAPI<{estado:ResultadoRegistro['estado']}>('/api/auth/registro',{method:'POST',body:JSON.stringify(datos)});
 return {modoDemo:false,estado:r.estado};
}
