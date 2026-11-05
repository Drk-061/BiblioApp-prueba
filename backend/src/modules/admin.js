import { Router } from 'express';
import { pool } from '../config/db.js';
import { auth, roles } from '../lib/auth.js';
import { asyncRoute,must } from '../lib/http.js';
import {avisoSeguro} from '../lib/notificaciones.js';
const r=Router();r.use(auth,roles('ADMIN'));
r.get('/configuracion',asyncRoute(async(_req,res)=>{
  const [rows] = await pool.execute('SELECT * FROM configuracion_biblioteca WHERE id=1');
  res.json({registroEncargadosHabilitado:Boolean(rows[0]?.registro_encargados_habilitado)});
}));
r.patch('/configuracion/registro-encargados',asyncRoute(async(req,res)=>{
  must(typeof req.body?.habilitado==='boolean',400,'Debes enviar habilitado: true o false.');
  await pool.execute('UPDATE configuracion_biblioteca SET registro_encargados_habilitado=? WHERE id=1',[req.body.habilitado]);
  res.json({habilitado:req.body.habilitado});
}));
r.get('/solicitudes-encargado',asyncRoute(async(_req,res)=>{
  const [rows]=await pool.query(`SELECT s.cve_solicitud AS id,s.cve_usuario AS matricula,
    CONCAT_WS(' ',u.nombres,u.apellido_paterno,u.apellido_materno) AS nombre,
    s.estado,s.fecha_solicitud AS fecha FROM solicitud_encargado s JOIN usuario u ON u.cve_usuario=s.cve_usuario
    ORDER BY s.fecha_solicitud DESC`);
  res.json({solicitudes:rows});
}));
r.patch('/solicitudes-encargado/:id',asyncRoute(async(req,res)=>{
  const id=Number(req.params.id);
  must(Number.isSafeInteger(id)&&id>0 && typeof req.body?.aprobar==='boolean',400,'Solicitud/decisión inválida.');
  const [previa]=await pool.execute('SELECT cve_usuario AS destino FROM solicitud_encargado WHERE cve_solicitud=?',[id]);
  await pool.execute('CALL sp_aprobar_encargado(?,?,?)',[id,req.user.cve_usuario,req.body.aprobar]);
  if(previa[0]) await avisoSeguro({destino:previa[0].destino,tipo:'ENCARGADO_APROBADO',
    variables:{estado:req.body.aprobar?'aprobada':'rechazada'},evento:`ENCARGADO_APROBADO:${id}`});
  res.json({mensaje:req.body.aprobar?'Encargado aprobado.':'Solicitud rechazada.'});
}));
r.get('/encargados',asyncRoute(async(_req,res)=>{
  const [rows]=await pool.query(`SELECT cve_usuario AS matricula, CONCAT_WS(' ',nombres,apellido_paterno,apellido_materno) AS nombre,estado_cuenta AS estado
    FROM usuario WHERE cve_tipo_usuario='ENCARGADO' ORDER BY fecha_registro DESC`);
  res.json({encargados:rows});
}));
r.get('/solicitudes-baja',asyncRoute(async(_req,res)=>{
  const [rows]=await pool.query(`SELECT s.cve_solicitud_baja AS id,s.cve_usuario AS matricula,
  CONCAT_WS(' ',u.nombres,u.apellido_paterno,u.apellido_materno) AS nombre,s.motivo,s.estado,s.fecha_solicitud AS fecha
  FROM solicitud_baja_usuario s JOIN usuario u ON u.cve_usuario=s.cve_usuario ORDER BY s.fecha_solicitud DESC LIMIT 200`);
  res.json({solicitudes:rows});
}));
r.patch('/solicitudes-baja/:id',asyncRoute(async(req,res)=>{
  const id=Number(req.params.id);
  must(Number.isSafeInteger(id)&&id>0&&typeof req.body?.aprobar==='boolean',400,'Solicitud o decisión no válida');
  const [solicitud]=await pool.execute('SELECT cve_usuario FROM solicitud_baja_usuario WHERE cve_solicitud_baja=?',[id]);
  await pool.query('CALL sp_resolver_baja_encargado(?,?,?)',[id,req.user.cve_usuario,req.body.aprobar]);
  if(solicitud[0]) await avisoSeguro({destino:solicitud[0].cve_usuario,tipo:'BAJA_RESUELTA',
    variables:{estado:req.body.aprobar?'aprobada':'rechazada'},evento:`BAJA_RESUELTA:${id}`});
  res.json({mensaje:req.body.aprobar?'Baja autorizada':'Solicitud rechazada'});
}));
export default r;
