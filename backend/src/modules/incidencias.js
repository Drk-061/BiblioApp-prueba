import {Router} from 'express';
import {randomUUID} from 'node:crypto';
import {pool,tx} from '../config/db.js';
import {auth,roles} from '../lib/auth.js';
import {asyncRoute,must,text} from '../lib/http.js';
import {avisoSeguro,enviarUltimoAviso} from '../lib/notificaciones.js';
const r=Router();r.use(auth);
const select=`SELECT i.cve_reporte AS id,i.cve_detalle AS detalleId,i.cve_usuario_reporta AS reportadoPor,
 i.fecha_reporte AS fechaReporte,i.descripcion,i.cve_estado_incidencia AS estado,i.fecha_resolucion AS fechaResolucion,i.resolucion,
 p.cve_prestamo AS prestamoId,p.cve_usuario AS matricula,CONCAT_WS(' ',u.nombres,u.apellido_paterno,u.apellido_materno) AS nombre,
 e.cve_ejemplar AS codigoEjemplar,l.titulo FROM incidencia_extravio i JOIN prestamo_detalle d ON d.cve_detalle=i.cve_detalle
 JOIN prestamo p ON p.cve_prestamo=d.cve_prestamo JOIN usuario u ON u.cve_usuario=p.cve_usuario
 JOIN ejemplar e ON e.cve_ejemplar=d.cve_ejemplar JOIN libro l ON l.cve_libro=e.cve_libro`;
r.get('/',asyncRoute(async(req,res)=>{
 const staff=req.user.cve_tipo_usuario!=='CLIENTE';
 const [rows]=await pool.execute(`${select} ${staff?'':'WHERE p.cve_usuario=?'} ORDER BY i.fecha_reporte DESC LIMIT 300`,staff?[]:[req.user.cve_usuario]);
 res.json({incidencias:rows});
}));
r.get('/:id',asyncRoute(async(req,res)=>{
 const [rows]=await pool.execute(`${select} WHERE i.cve_reporte=?`,[req.params.id]);
 must(rows.length,404,'Incidencia inexistente');
 must(req.user.cve_tipo_usuario!=='CLIENTE'||rows[0].matricula===req.user.cve_usuario,403,'Acceso denegado');
 res.json({incidencia:rows[0]});
}));
r.post('/',asyncRoute(async(req,res)=>{
 const detalleId=Number(req.body?.detalleId),descripcion=text(req.body?.descripcion,4000);
 must(Number.isSafeInteger(detalleId)&&detalleId>0&&descripcion.length>=10,400,'Indica un ejemplar y la descripción (mín. 10 caracteres)');
 const [encontrados]=await pool.execute('SELECT p.cve_usuario AS titular FROM prestamo_detalle d JOIN prestamo p ON p.cve_prestamo=d.cve_prestamo WHERE d.cve_detalle=?',[detalleId]);
 const r0=encontrados[0];
 must(r0,404,'Detalle inexistente');
 must(req.user.cve_tipo_usuario!=='CLIENTE'||r0.titular===req.user.cve_usuario,403,'Solo puedes reportar tus ejemplares');
 const id=randomUUID();
 await pool.query('CALL sp_reportar_extravio(?,?,?,?)',[id,detalleId,r0.titular,descripcion]);
 const [staff]=await pool.execute(`SELECT DISTINCT n.cve_usuario_destino AS destino,n.cve_prestamo AS prestamoId
  FROM notificacion n WHERE n.mensaje=? AND n.cve_tipo_notificacion='EXTRAVIO'`,[`Revisar reporte ${id}`]);
 for (const x of staff) await enviarUltimoAviso({destino:x.destino,prestamoId:x.prestamoId,tipo:'EXTRAVIO'});
 res.status(201).json({id,mensaje:'Reporte enviado'});
}));
r.patch('/:id/seguimiento',roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
 const estado=req.body?.estado,observaciones=text(req.body?.observaciones,500);
 must(['EN_PROCESO','RESUELTA'].includes(estado),400,'Estado no válido');
 must(observaciones.length>0,400,'Escribe observaciones');
 if(estado==='RESUELTA') {
   const fisico=req.body?.estadoFisico||'BAJA';
   must(['DISPONIBLE','DANADO','EXTRAVIADO','BAJA'].includes(fisico),400,'Estado físico inválido');
   await pool.query('CALL sp_resolver_extravio(?,?,?,?)',[req.params.id,req.user.cve_usuario,fisico,observaciones]);
 } else {
   await tx(async c=>{
     const [rows]=await c.execute('SELECT cve_estado_incidencia FROM incidencia_extravio WHERE cve_reporte=? FOR UPDATE',[req.params.id]);
     must(rows.length,404,'Incidencia inexistente');must(rows[0].cve_estado_incidencia!=='RESUELTA',409,'Incidencia ya resuelta');
     await c.execute("UPDATE incidencia_extravio SET cve_estado_incidencia='EN_PROCESO',resolucion=? WHERE cve_reporte=?",[observaciones,req.params.id]);
     await c.execute('INSERT INTO auditoria_sistema(cve_actor,accion,entidad,identificador_entidad) VALUES(?,?,?,?)',[req.user.cve_usuario,'SEGUIMIENTO_INCIDENCIA','incidencia_extravio',req.params.id]);
   });
 }
 const [destinos]=await pool.execute(`SELECT p.cve_usuario,p.cve_prestamo FROM incidencia_extravio i
  JOIN prestamo_detalle d ON d.cve_detalle=i.cve_detalle JOIN prestamo p ON p.cve_prestamo=d.cve_prestamo WHERE i.cve_reporte=?`,[req.params.id]);
 if(destinos.length) await avisoSeguro({destino:destinos[0].cve_usuario,
  tipo:'INCIDENCIA_RESUELTA',prestamoId:destinos[0].cve_prestamo,
  variables:{reporte:req.params.id,estado},evento:`INCIDENCIA:${req.params.id}:${estado}`});
 res.json({mensaje:'Seguimiento actualizado'});
}));
export default r;
