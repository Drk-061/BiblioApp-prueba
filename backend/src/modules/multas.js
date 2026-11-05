import {Router} from 'express';
import {randomUUID} from 'node:crypto';
import {pool,tx} from '../config/db.js';
import {auth,roles} from '../lib/auth.js';
import {asyncRoute,must} from '../lib/http.js';
const r=Router();r.use(auth);
const select=`SELECT m.cve_multa AS id,m.cve_prestamo AS prestamoId,m.cve_detalle AS detalleId,m.motivo,m.descripcion,
 m.fecha_emision AS fechaGenerada,m.monto,m.cve_estado_pago AS estado,m.fecha_pago AS fechaPago,
 p.cve_usuario AS matricula,CONCAT_WS(' ',u.nombres,u.apellido_paterno,u.apellido_materno) AS nombre,
 p.fecha_limite AS fechaLimite,d.fecha_devolucion AS fechaDevolucion,e.cve_ejemplar AS codigoEjemplar,l.titulo,l.editorial,
 GREATEST(DATEDIFF(COALESCE(d.fecha_devolucion,CURRENT_DATE()),p.fecha_limite),0) AS diasRetraso
 FROM multa m JOIN prestamo p ON p.cve_prestamo=m.cve_prestamo JOIN usuario u ON u.cve_usuario=p.cve_usuario
 LEFT JOIN prestamo_detalle d ON d.cve_detalle=m.cve_detalle LEFT JOIN ejemplar e ON e.cve_ejemplar=d.cve_ejemplar
 LEFT JOIN libro l ON l.cve_libro=e.cve_libro`;
r.get('/',asyncRoute(async(req,res)=>{
 const staff=['ADMIN','ENCARGADO'].includes(req.user.cve_tipo_usuario);
 const [rows]=await pool.execute(`${select} ${staff?'':'WHERE p.cve_usuario=?'} ORDER BY m.fecha_emision DESC LIMIT 300`,staff?[]:[req.user.cve_usuario]);
 res.json({multas:rows});
}));
r.get('/:id',asyncRoute(async(req,res)=>{
 const [rows]=await pool.execute(`${select} WHERE m.cve_multa=?`,[req.params.id]);
 must(rows.length,404,'Multa no encontrada');
 must(req.user.cve_tipo_usuario!=='CLIENTE'||rows[0].matricula===req.user.cve_usuario,403,'No tienes acceso a esta multa');
 res.json({multa:rows[0]});
}));
r.post('/',roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
 const detalleId=Number(req.body?.detalleId),motivo=req.body?.motivo||'RETRASO';
 const monto=Number(req.body?.monto);
 must(Number.isSafeInteger(detalleId)&&detalleId>0,400,'Indica detalle de préstamo');
 must(['RETRASO','EXTRAVIO','DANIO','OTRO'].includes(motivo),400,'Motivo de multa inválido');
 must(Number.isFinite(monto)&&monto>0&&monto<=100000,400,'Monto inválido');
 const id=randomUUID();
 await tx(async c=>{
   const [detalles]=await c.execute('SELECT d.cve_prestamo,p.cve_usuario FROM prestamo_detalle d JOIN prestamo p ON p.cve_prestamo=d.cve_prestamo WHERE d.cve_detalle=? FOR UPDATE',[detalleId]);
   must(detalles.length,404,'Detalle de préstamo inexistente');
   const {cve_prestamo,cve_usuario}=detalles[0];
   const [previas]=await c.execute("SELECT cve_multa FROM multa WHERE cve_detalle=? AND motivo=? AND cve_estado_pago='PENDIENTE'",[detalleId,motivo]);
   must(!previas.length,409,'Ya existe una multa pendiente por el mismo motivo');
   await c.execute('INSERT INTO multa(cve_multa,cve_prestamo,cve_detalle,motivo,descripcion,monto) VALUES(?,?,?,?,?,?)',
    [id,cve_prestamo,detalleId,motivo,String(req.body?.descripcion||'Registro de multa por biblioteca').slice(0,500),monto]);
   await c.execute("INSERT INTO notificacion(cve_notificacion,cve_usuario_destino,cve_prestamo,cve_tipo_notificacion,titulo,mensaje) VALUES(UUID(),?,?,'MULTA','Nueva multa','Se registró una multa en tu cuenta. Consulta sus detalles.')",[cve_usuario,cve_prestamo]);
   await c.execute('INSERT INTO auditoria_sistema(cve_actor,accion,entidad,identificador_entidad) VALUES(?,?,?,?)',[req.user.cve_usuario,'CREAR_MULTA','multa',id]);
 });
 res.status(201).json({id,mensaje:'Multa registrada'});
}));
r.patch('/:id/pagar',roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
 await tx(async c=>{
   const [rows]=await c.execute('SELECT cve_estado_pago FROM multa WHERE cve_multa=? FOR UPDATE',[req.params.id]);
   must(rows.length,404,'Multa inexistente');must(rows[0].cve_estado_pago==='PENDIENTE',409,'La multa ya no está pendiente');
   await c.execute("UPDATE multa SET cve_estado_pago='PAGADA',fecha_pago=NOW(),referencia_pago=? WHERE cve_multa=?",[String(req.body?.referencia||'Pago confirmado en biblioteca').slice(0,120),req.params.id]);
   await c.execute('INSERT INTO auditoria_sistema(cve_actor,accion,entidad,identificador_entidad) VALUES(?,?,?,?)',[req.user.cve_usuario,'PAGAR_MULTA','multa',req.params.id]);
 });res.json({mensaje:'Pago registrado'});
}));
export default r;
