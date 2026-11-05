import { Router } from 'express';
import { pool, tx } from '../config/db.js';
import { auth, roles } from '../lib/auth.js';
import { asyncRoute, must, text } from '../lib/http.js';
const r=Router();r.use(auth,roles('ENCARGADO','ADMIN'));
const resumen=`SELECT u.cve_usuario AS matricula,CONCAT_WS(' ',u.nombres,u.apellido_paterno,u.apellido_materno) AS nombre,
 u.correo,u.cve_tipo_usuario AS rol,u.estado_cuenta AS estado,
 (SELECT COUNT(*) FROM prestamo p JOIN prestamo_detalle d ON d.cve_prestamo=p.cve_prestamo WHERE p.cve_usuario=u.cve_usuario AND d.fecha_cierre IS NULL) AS prestamosActivos,
 (SELECT COALESCE(SUM(m.monto),0) FROM multa m JOIN prestamo p ON p.cve_prestamo=m.cve_prestamo WHERE p.cve_usuario=u.cve_usuario AND m.cve_estado_pago='PENDIENTE') AS adeudo
 FROM usuario u`;
r.get('/',asyncRoute(async(req,res)=>{
 const [rows]=await pool.query(`${resumen} WHERE u.cve_tipo_usuario<>'ADMIN' ORDER BY u.fecha_registro DESC LIMIT 300`);
 res.json({usuarios:rows});
}));
r.get('/:matricula',asyncRoute(async(req,res)=>{
 const [rows]=await pool.execute(`${resumen} WHERE u.cve_usuario=?`,[req.params.matricula]);
 must(rows.length,404,'Usuario inexistente');res.json({usuario:rows[0]});
}));
r.post('/:matricula/solicitar-baja',asyncRoute(async(req,res)=>{
 const objetivo=text(req.params.matricula,30).toUpperCase(), motivo=text(req.body?.motivo,500);
 must(motivo,400,'Indica motivo');
 await tx(async conn=>{
   const [us]=await conn.execute('SELECT cve_tipo_usuario,estado_cuenta FROM usuario WHERE cve_usuario=? FOR UPDATE',[objetivo]);
   must(us[0]?.cve_tipo_usuario==='ENCARGADO'&&us[0]?.estado_cuenta==='ACTIVA',409,'El objetivo debe ser un encargado activo');
   const [pendientes]=await conn.execute("SELECT cve_solicitud_baja FROM solicitud_baja_usuario WHERE cve_usuario=? AND estado='PENDIENTE'",[objetivo]);
   must(!pendientes.length,409,'Ya existe solicitud pendiente');
   await conn.execute('INSERT INTO solicitud_baja_usuario(cve_usuario,motivo) VALUES(?,?)',[objetivo,motivo]);
   await conn.execute('INSERT INTO auditoria_sistema(cve_actor,accion,entidad,identificador_entidad) VALUES(?,?,?,?)',[req.user.cve_usuario,'SOLICITAR_BAJA','usuario',objetivo]);
 });
 res.status(201).json({mensaje:'Solicitud enviada al administrador'});
}));
r.patch('/:matricula/baja',asyncRoute(async(req,res)=>{
 const objetivo=text(req.params.matricula,30).toUpperCase();
 await tx(async conn=>{
   const [rows]=await conn.execute('SELECT cve_tipo_usuario,estado_cuenta FROM usuario WHERE cve_usuario=? FOR UPDATE',[objetivo]);
   must(rows.length,404,'Usuario inexistente');
   must(rows[0].estado_cuenta==='ACTIVA',409,'Cuenta ya inactiva');
   must(rows[0].cve_tipo_usuario!=='ADMIN',403,'No se puede dar de baja un administrador');
   must(req.user.cve_tipo_usuario==='ADMIN'||rows[0].cve_tipo_usuario==='CLIENTE',403,'La baja de encargados requiere autorización del admin');
   const [p]=await conn.execute('SELECT COUNT(*) AS n FROM prestamo p JOIN prestamo_detalle d ON d.cve_prestamo=p.cve_prestamo WHERE p.cve_usuario=? AND d.fecha_cierre IS NULL',[objetivo]);
   const [m]=await conn.execute("SELECT COALESCE(SUM(m.monto),0) AS total FROM multa m JOIN prestamo p ON p.cve_prestamo=m.cve_prestamo WHERE p.cve_usuario=? AND m.cve_estado_pago='PENDIENTE'",[objetivo]);
   const [asignados]=await conn.execute("SELECT COUNT(*) AS n FROM prestamo WHERE cve_encargado=? AND cve_estado_prestamo='ACTIVO'",[objetivo]);
   must(!p[0].n&&!Number(m[0].total)&&!asignados[0].n,409,'Tiene préstamos, operaciones asignadas o multas pendientes');
   await conn.execute("UPDATE usuario SET estado_cuenta='INACTIVA' WHERE cve_usuario=?",[objetivo]);
   await conn.execute('UPDATE credencial_digital SET fecha_revocacion=NOW() WHERE cve_usuario=? AND fecha_revocacion IS NULL',[objetivo]);
   await conn.execute('INSERT INTO auditoria_sistema(cve_actor,accion,entidad,identificador_entidad) VALUES(?,?,?,?)',[req.user.cve_usuario,'BAJA_USUARIO','usuario',objetivo]);
 });
 res.json({mensaje:'Cuenta desactivada'});
}));
export default r;
