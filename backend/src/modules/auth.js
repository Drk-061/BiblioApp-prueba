import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool, tx } from '../config/db.js';
import { auth, issueToken, publicUser } from '../lib/auth.js';
import { asyncRoute, assertString, HttpError, must, text } from '../lib/http.js';
import {avisoSeguro} from '../lib/notificaciones.js';
const r=Router();
const idPattern=/^[A-Z0-9-]{5,30}$/;
const mailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateRegistro(b) {
  const matricula=assertString(b.matricula,'Matrícula',5,30).toUpperCase();
  must(idPattern.test(matricula),400,'Matrícula inválida: solo letras, números y guiones.');
  const nombres=assertString(b.nombres,'Nombres',2,120);
  const apellidoPaterno=assertString(b.apellidoPaterno,'Apellido paterno',2,90);
  const apellidoMaterno=text(b.apellidoMaterno,90) || null;
  const correo=assertString(b.correo,'Correo',5,254).toLowerCase();
  must(mailPattern.test(correo),400,'Correo electrónico inválido.');
  must(typeof b.contrasena==='string' && b.contrasena.length>=8 && b.contrasena.length<=72,400,'La contraseña debe tener entre 8 y 72 caracteres.');
  must(['CLIENTE','ENCARGADO'].includes(b.tipoUsuario),400,'Tipo de usuario no permitido.');
  return { matricula,nombres,apellidoPaterno,apellidoMaterno,correo,contrasena:b.contrasena,tipoUsuario:b.tipoUsuario };
}
r.get('/registro/encargados/disponibilidad',asyncRoute(async (_req,res)=>{
  const [rows]=await pool.execute('SELECT registro_encargados_habilitado FROM configuracion_biblioteca WHERE id=1');
  res.json({habilitado: Boolean(rows[0]?.registro_encargados_habilitado)});
}));
r.post('/auth/registro',asyncRoute(async (req,res)=>{
  const p=validateRegistro(req.body||{});
  const hash=await bcrypt.hash(p.contrasena,12);
  const estado=p.tipoUsuario==='CLIENTE' ? 'ACTIVA' : 'PENDIENTE';
  await tx(async(conn)=>{
    if (p.tipoUsuario==='ENCARGADO') {
      const [cfg]=await conn.execute('SELECT registro_encargados_habilitado AS habilitado FROM configuracion_biblioteca WHERE id=1 FOR UPDATE');
      must(cfg[0]?.habilitado===1,403,'El registro de encargados está deshabilitado.');
    }
    await conn.execute(`INSERT INTO usuario
      (cve_usuario,nombres,apellido_paterno,apellido_materno,correo,contrasena_hash,cve_tipo_usuario,estado_cuenta)
      VALUES (?,?,?,?,?,?,?,?)`, [p.matricula,p.nombres,p.apellidoPaterno,p.apellidoMaterno,p.correo,hash,p.tipoUsuario,estado]);
    if (p.tipoUsuario==='ENCARGADO') await conn.execute('INSERT INTO solicitud_encargado(cve_usuario) VALUES(?)',[p.matricula]);
  });
  if(p.tipoUsuario==='ENCARGADO') {
    const [admins]=await pool.execute("SELECT cve_usuario AS id FROM usuario WHERE cve_tipo_usuario='ADMIN' AND estado_cuenta='ACTIVA'");
    for(const admin of admins) await avisoSeguro({destino:admin.id,tipo:'SOLICITUD_ENCARGADO',
      variables:{usuario:p.matricula},evento:`SOLICITUD_ENCARGADO:${p.matricula}:${admin.id}`});
  }
  res.status(201).json({estado: estado==='ACTIVA' ?'REGISTRADO':'PENDIENTE_APROBACION',mensaje:estado==='ACTIVA'?'Cliente registrado.':'Solicitud enviada al administrador.'});
}));
r.post('/auth/login',asyncRoute(async(req,res)=>{
  const matricula=text(req.body?.matricula,30).toUpperCase();
  const password=req.body?.contrasena;
  must(matricula && typeof password==='string',400,'Matrícula y contraseña requeridas.');
  const [rows]=await pool.execute('SELECT * FROM usuario WHERE cve_usuario=? LIMIT 1',[matricula]);
  const user=rows[0];
  if (!user) throw new HttpError(401,'Credenciales incorrectas.');
  const valid=await bcrypt.compare(password,user.contrasena_hash);
  if (!valid) throw new HttpError(401,'Credenciales incorrectas.');
  if (user.estado_cuenta!=='ACTIVA') throw new HttpError(403,'Cuenta pendiente de aprobación o inactiva.');
  res.json({token:issueToken(user),usuario:publicUser(user)});
}));
r.get('/auth/me',auth,(req,res)=>res.json({usuario:publicUser(req.user)}));
export default r;
