import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { pool } from '../config/db.js';
import { auth,roles } from '../lib/auth.js';
import { asyncRoute,must,text } from '../lib/http.js';
const r=Router();r.use(auth);
r.get('/',asyncRoute(async(req,res)=>{
  const personal=['ADMIN','ENCARGADO'].includes(req.user.cve_tipo_usuario);
  const query=`SELECT p.cve_prestamo AS id,p.cve_usuario AS matricula,
    CONCAT_WS(' ',u.nombres,u.apellido_paterno,u.apellido_materno) AS nombreUsuario,
    p.fecha_prestamo AS fechaPrestamo,p.fecha_limite AS fechaLimite,p.cve_estado_prestamo AS estado,
    d.cve_detalle AS detalleId,d.cve_ejemplar AS codigoEjemplar,d.cve_estado_detalle AS estadoEjemplar,
    d.fecha_devolucion AS fechaDevolucion,
    (SELECT COUNT(*) FROM prestamo_renovacion pr WHERE pr.cve_prestamo=p.cve_prestamo) AS renovaciones,l.titulo,
    COALESCE((SELECT GROUP_CONCAT(a.nombre_autor SEPARATOR ', ') FROM libro_autor la JOIN autor a ON a.cve_autor=la.cve_autor WHERE la.cve_libro=l.cve_libro),'') AS autor
    FROM prestamo p JOIN usuario u ON u.cve_usuario=p.cve_usuario
    JOIN prestamo_detalle d ON d.cve_prestamo=p.cve_prestamo
    JOIN ejemplar e ON e.cve_ejemplar=d.cve_ejemplar JOIN libro l ON l.cve_libro=e.cve_libro
    ${personal?'':'WHERE p.cve_usuario=?'} ORDER BY p.fecha_registro DESC,d.cve_detalle ASC LIMIT 500`;
  const [rows]=await pool.execute(query,personal?[]:[req.user.cve_usuario]);
  const mapa=new Map();
  for(const row of rows) {
    if(!mapa.has(row.id)) mapa.set(row.id,{id:row.id,matricula:row.matricula,nombreUsuario:row.nombreUsuario,
      fechaPrestamo:row.fechaPrestamo,fechaLimite:row.fechaLimite,estado:row.estado,renovaciones:row.renovaciones,ejemplares:[]});
    mapa.get(row.id).ejemplares.push({detalleId:row.detalleId,codigo:row.codigoEjemplar,titulo:row.titulo,
      autor:row.autor,estado:row.estadoEjemplar,fechaDevolucion:row.fechaDevolucion});
  }
  res.json({prestamos:[...mapa.values()]});
}));
r.post('/',roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const matricula=text(req.body?.matricula,30).toUpperCase();
  const ejemplares=req.body?.ejemplares;
  must(matricula && Array.isArray(ejemplares) && ejemplares.length>0&&ejemplares.length<=100,400,'Indica cliente y uno o más ejemplares.');
  const codigos=ejemplares.map(e=>text(e,36).toUpperCase());
  must(codigos.every(Boolean) && new Set(codigos).size===codigos.length,400,'Los códigos deben ser válidos y no repetidos.');
  const id=randomUUID();
  // El SP existente valida el rol, cliente y disponibilidad en transacción.
  await pool.query('CALL sp_registrar_prestamo(?,?,?,?)',[id,matricula,req.user.cve_usuario,JSON.stringify(codigos)]);
  res.status(201).json({id,mensaje:`Préstamo registrado con ${codigos.length} ejemplar(es).`});
}));
r.get('/cliente/:matricula',roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const matricula=text(req.params.matricula,30).toUpperCase();
  const [rows]=await pool.execute(`SELECT cve_usuario AS matricula,CONCAT_WS(' ',nombres,apellido_paterno,apellido_materno) AS nombre,
    cve_tipo_usuario AS rol,estado_cuenta AS estado FROM usuario WHERE cve_usuario=?`,[matricula]);
  must(rows.length>0&&rows[0].rol==='CLIENTE'&&rows[0].estado==='ACTIVA',404,'Cliente no encontrado o inactivo.');
  res.json({cliente:rows[0]});
}));
r.get('/ejemplar/:codigo',roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const codigo=text(req.params.codigo,36).toUpperCase();
  const [rows]=await pool.execute(`SELECT e.cve_ejemplar AS codigo,e.cve_estado_ejemplar AS estado,
    l.titulo,l.activo FROM ejemplar e JOIN libro l ON l.cve_libro=e.cve_libro WHERE e.cve_ejemplar=?`,[codigo]);
  must(rows.length>0&&rows[0].activo===1,404,'Ejemplar no encontrado o libro inactivo.');
  res.json({ejemplar:rows[0]});
}));
// Devuelve una sola copia física del préstamo; el SP protege el inventario.
r.post('/:id/devoluciones',roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const id=text(req.params.id,36);
  const codigo=text(req.body?.codigoEjemplar,36).toUpperCase();
  const fisico=text(req.body?.estadoFisico,20).toUpperCase();
  must(id&&codigo&&['DISPONIBLE','DANADO'].includes(fisico),400,'Datos de devolución inválidos.');
  await pool.query('CALL sp_registrar_devolucion(?,?,?,?)',[
    id,codigo,req.user.cve_usuario,fisico
  ]);
  res.json({mensaje:'Devolución registrada correctamente.'});
}));
r.post('/:id/renovar',asyncRoute(async(req,res)=>{
  // El SP valida titular, fecha, estado y número máximo de renovaciones.
  const [rows]=await pool.execute('SELECT cve_usuario FROM prestamo WHERE cve_prestamo=?',[req.params.id]);
  must(rows.length>0,404,'Préstamo inexistente');
  const titular=rows[0].cve_usuario;
  must(req.user.cve_tipo_usuario!=='CLIENTE'||req.user.cve_usuario===titular,403,'No puedes renovar préstamos ajenos');
  await pool.query('CALL sp_renovar_prestamo(?,?)',[req.params.id,titular]);
  await pool.execute(`INSERT INTO notificacion(cve_notificacion,cve_usuario_destino,cve_prestamo,cve_tipo_notificacion,titulo,mensaje)
    VALUES(UUID(),?,?,'SISTEMA','Préstamo renovado','Se actualizó la fecha límite de tu préstamo.')`,[titular,req.params.id]);
  res.json({mensaje:'Préstamo renovado'});
}));
r.get('/:id/renovaciones',asyncRoute(async(req,res)=>{
  const [rows]=await pool.execute('SELECT cve_usuario FROM prestamo WHERE cve_prestamo=?',[req.params.id]);
  must(rows.length,404,'Préstamo inexistente');
  must(req.user.cve_tipo_usuario!=='CLIENTE'||rows[0].cve_usuario===req.user.cve_usuario,403,'Acceso denegado');
  const [renovaciones]=await pool.execute('SELECT fecha_renovacion AS fecha,fecha_limite_anterior AS anterior,fecha_limite_nueva AS nueva FROM prestamo_renovacion WHERE cve_prestamo=? ORDER BY fecha_renovacion DESC',[req.params.id]);
  res.json({renovaciones});
}));
export default r;
