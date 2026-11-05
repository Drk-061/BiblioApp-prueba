import { Router } from 'express';
import { randomUUID, randomBytes } from 'node:crypto';
import { pool, tx } from '../config/db.js';
import { auth,roles } from '../lib/auth.js';
import { asyncRoute,assertString,must,text } from '../lib/http.js';
const r=Router();
const categorías = new Set(['MATEMATICAS','CIENCIAS','PROGRAMACION','LITERATURA','OTROS']);
const codQR=codigo=>JSON.stringify({ tipo:'ejemplar', codigoEjemplar:codigo });
const codigoAleatorio=()=>`EJ-${randomBytes(6).toString('hex').toUpperCase()}`;
export function validateLibro(b) {
  const isbn=text(b.isbn,17).replace(/[\s-]/g,'')||null;
  must(!isbn||/^(\d{13}|\d{9}[\dX])$/.test(isbn),400,'ISBN inválido.');
  const titulo=assertString(b.titulo,'Título',2,250);
  const autor=assertString(b.autor,'Autor',2,180);
  const categoria=text(b.categoria,30).toUpperCase();
  must(categorías.has(categoria),400,'Categoría no válida.');
  const anio=b.anioPublicacion==null?null:Number(b.anioPublicacion);
  const paginas=b.numeroPaginas==null?null:Number(b.numeroPaginas);
  must(anio===null||(Number.isInteger(anio)&&anio>=1&&anio<=9999),400,'Año no válido.');
  must(paginas===null||(Number.isInteger(paginas)&&paginas>0),400,'Páginas no válidas.');
  const cantidad=b.cantidadEjemplares==null?1:Number(b.cantidadEjemplares);
  must(Number.isInteger(cantidad)&&cantidad>=0&&cantidad<=30,400,'Cantidad debe estar entre 0 y 30.');
  const palabras=Array.isArray(b.palabrasClave)?b.palabrasClave:[];
  must(palabras.length<=20,400,'Máximo 20 palabras clave.');
  return { isbn,titulo,autor,categoria,anio,paginas,cantidad,
    editorial:text(b.editorial,150)||null,edicion:text(b.edicion,80)||null,
    idioma:text(b.idioma,50)||'Español',
    ubicacion:text(b.ubicacion,180)||'Por asignar',
    palabras:[...new Set(palabras.map(x=>text(x,100)).filter(Boolean))] };
}
async function crearEjemplar(conn, libroId, codigo, ubicacion, barras=null) {
  const clave=codigo||codigoAleatorio();
  const qr=codQR(clave);
  await conn.execute(`INSERT INTO ejemplar (cve_ejemplar,cve_libro,cve_estado_ejemplar,codigo_qr,codigo_barras,ubicacion)
    VALUES (?,?, 'DISPONIBLE',?,?,?)`,[clave,libroId,qr,barras,ubicacion]);
  return {codigo:clave,qr,estado:'DISPONIBLE',ubicacion};
}
r.get('/',asyncRoute(async(req,res)=>{
  const buscar=text(req.query.buscar,100);
  const q=buscar?`AND (l.titulo LIKE ? OR l.editorial LIKE ? OR EXISTS (
    SELECT 1 FROM libro_autor la2 JOIN autor a2 ON a2.cve_autor=la2.cve_autor
    WHERE la2.cve_libro=l.cve_libro AND a2.nombre_autor LIKE ?))`:' ';
  const args=buscar?Array(3).fill(`%${buscar}%`):[];
  const [rows]=await pool.execute(`SELECT l.cve_libro AS id,l.isbn,l.titulo,l.editorial,l.edicion,l.anio_publicacion AS anioPublicacion,
    l.numero_paginas AS numeroPaginas,l.idioma,l.cve_categoria AS categoria,
    COALESCE((SELECT GROUP_CONCAT(a.nombre_autor ORDER BY la.orden_autoria SEPARATOR ', ')
      FROM libro_autor la JOIN autor a ON a.cve_autor=la.cve_autor WHERE la.cve_libro=l.cve_libro),'') AS autor,
    COALESCE(v.ejemplares_totales,0) AS ejemplaresTotales,
    COALESCE(v.ejemplares_disponibles,0) AS ejemplaresDisponibles
    FROM libro l LEFT JOIN vw_libros_disponibilidad v ON v.cve_libro=l.cve_libro
    WHERE l.activo=TRUE ${q} ORDER BY l.fecha_registro DESC LIMIT 200`,args);
  res.json({libros:rows});
}));
r.get('/:id',asyncRoute(async(req,res)=>{
  const [rows]=await pool.execute(`SELECT l.cve_libro AS id,l.isbn,l.titulo,l.editorial,l.edicion,l.anio_publicacion AS anioPublicacion,
    l.numero_paginas AS numeroPaginas,l.idioma,l.cve_categoria AS categoria,
    COALESCE((SELECT GROUP_CONCAT(a.nombre_autor ORDER BY la.orden_autoria SEPARATOR ', ')
      FROM libro_autor la JOIN autor a ON a.cve_autor=la.cve_autor WHERE la.cve_libro=l.cve_libro),'') AS autor,
    COALESCE(v.ejemplares_disponibles,0) AS ejemplaresDisponibles
    FROM libro l LEFT JOIN vw_libros_disponibilidad v ON v.cve_libro=l.cve_libro
    WHERE l.cve_libro=? AND l.activo=TRUE`,[req.params.id]);
  must(rows.length>0,404,'Libro no encontrado.');res.json({libro:rows[0]});
}));
r.get('/:id/ejemplares',asyncRoute(async(req,res)=>{
  const [rows]=await pool.execute(`SELECT cve_ejemplar AS codigo,cve_estado_ejemplar AS estado,codigo_qr AS qr,codigo_barras AS codigoBarras,ubicacion
    FROM ejemplar WHERE cve_libro=? ORDER BY fecha_registro DESC`,[req.params.id]);
  res.json({ejemplares:rows});
}));
r.post('/',auth,roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const p=validateLibro(req.body||{});
  const id=randomUUID();
  const ejemplares=await tx(async(conn)=>{
    await conn.execute(`INSERT INTO libro(cve_libro,isbn,titulo,editorial,edicion,anio_publicacion,idioma,
      numero_paginas,cve_categoria) VALUES (?,?,?,?,?,?,?,?,?)`,
      [id,p.isbn,p.titulo,p.editorial,p.edicion,p.anio,p.idioma,p.paginas,p.categoria]);
    const [a]=await conn.execute('INSERT INTO autor(nombre_autor) VALUES(?)',[p.autor]);
    await conn.execute('INSERT INTO libro_autor(cve_libro,cve_autor,orden_autoria) VALUES(?,?,1)',[id,a.insertId]);
    for(const palabra of p.palabras) {
      await conn.execute('INSERT INTO palabra_clave(palabra) VALUES(?) ON DUPLICATE KEY UPDATE cve_palabra_clave=LAST_INSERT_ID(cve_palabra_clave)',[palabra]);
      const [[fila]]=await conn.query('SELECT LAST_INSERT_ID() AS id');
      await conn.execute('INSERT INTO libro_palabra_clave(cve_libro,cve_palabra_clave) VALUES(?,?)',[id,fila.id]);
    }
    const lista=[];
    for(let i=0;i<p.cantidad;i++) lista.push(await crearEjemplar(conn,id,null,p.ubicacion));
    return lista;
  });
  res.status(201).json({libro:{id,titulo:p.titulo,autor:p.autor},ejemplares,mensaje:'Libro guardado.'});
}));
r.post('/:id/ejemplares',auth,roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const codigo=text(req.body?.codigo,36).toUpperCase() || null;
  must(!codigo||/^[A-Z0-9-]{3,36}$/.test(codigo),400,'Clave de ejemplar inválida.');
  const barras=text(req.body?.codigoBarras,80)||null;
  const ubicacion=text(req.body?.ubicacion,180)||'Por asignar';
  const ejemplar=await tx(async(conn)=>{
    const [libros]=await conn.execute('SELECT activo FROM libro WHERE cve_libro=? FOR UPDATE',[req.params.id]);
    must(libros[0]?.activo===1,404,'Libro inexistente o inactivo.');
    return await crearEjemplar(conn,req.params.id,codigo,ubicacion,barras);
  });
  res.status(201).json({ejemplar});
}));
r.put('/:id',auth,roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const p=validateLibro({...req.body,cantidadEjemplares:0});
  await tx(async conn=>{
    const [libros]=await conn.execute('SELECT activo FROM libro WHERE cve_libro=? FOR UPDATE',[req.params.id]);
    must(libros[0]?.activo===1,404,'Libro no existe o está dado de baja');
    await conn.execute(`UPDATE libro SET isbn=?,titulo=?,editorial=?,edicion=?,anio_publicacion=?,idioma=?,numero_paginas=?,cve_categoria=? WHERE cve_libro=?`,
      [p.isbn,p.titulo,p.editorial,p.edicion,p.anio,p.idioma,p.paginas,p.categoria,req.params.id]);
    const [autores]=await conn.execute('SELECT cve_autor FROM libro_autor WHERE cve_libro=? ORDER BY orden_autoria LIMIT 1',[req.params.id]);
    if(autores.length) {
      // No modificar la fila de autor compartida con otros libros.
      const [nuevoAutor]=await conn.execute('INSERT INTO autor(nombre_autor) VALUES(?)',[p.autor]);
      await conn.execute('UPDATE libro_autor SET cve_autor=? WHERE cve_libro=? AND cve_autor=?',
        [nuevoAutor.insertId,req.params.id,autores[0].cve_autor]);
    }
    else {
      const [a]=await conn.execute('INSERT INTO autor(nombre_autor) VALUES(?)',[p.autor]);
      await conn.execute('INSERT INTO libro_autor(cve_libro,cve_autor,orden_autoria) VALUES(?,?,1)',[req.params.id,a.insertId]);
    }
    if(Array.isArray(req.body?.palabrasClave)) {
    await conn.execute('DELETE FROM libro_palabra_clave WHERE cve_libro=?',[req.params.id]);
    for(const palabra of p.palabras){
      const [r0]=await conn.execute('INSERT INTO palabra_clave(palabra) VALUES(?) ON DUPLICATE KEY UPDATE cve_palabra_clave=LAST_INSERT_ID(cve_palabra_clave)',[palabra]);
      await conn.execute('INSERT INTO libro_palabra_clave(cve_libro,cve_palabra_clave) VALUES(?,?)',[req.params.id,r0.insertId]);
    }
    }
    await conn.execute('INSERT INTO auditoria_sistema(cve_actor,accion,entidad,identificador_entidad) VALUES(?,?,?,?)',[req.user.cve_usuario,'EDITAR_LIBRO','libro',req.params.id]);
  });res.json({mensaje:'Libro actualizado'});
}));
r.patch('/:id/baja',auth,roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const motivo=text(req.body?.motivo,500)||'Baja solicitada desde biblioteca';
  await pool.query('CALL sp_dar_baja_libro(?,?,?)',[req.params.id,req.user.cve_usuario,motivo]);
  res.json({mensaje:'Libro dado de baja'});
}));
r.patch('/:id/ejemplares/:codigo',auth,roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const estado=text(req.body?.estado,20).toUpperCase(),ubicacion=text(req.body?.ubicacion,180);
  must(['DISPONIBLE','PRESTADO','EXTRAVIADO','DANADO','BAJA'].includes(estado),400,'Estado no reconocido');
  await tx(async conn=>{
    const [copias]=await conn.execute('SELECT cve_estado_ejemplar AS estado FROM ejemplar WHERE cve_libro=? AND cve_ejemplar=? FOR UPDATE',[req.params.id,req.params.codigo]);
    must(copias.length,404,'Ejemplar inexistente');
    const [abiertos]=await conn.execute('SELECT COUNT(*) AS n FROM prestamo_detalle WHERE cve_ejemplar=? AND fecha_cierre IS NULL',[req.params.codigo]);
    must(!abiertos[0].n,409,'No se puede editar el estado de un ejemplar con préstamo abierto');
    must(estado!=='PRESTADO'&&estado!=='EXTRAVIADO',400,'Estos estados solo se asignan por préstamo o incidencia');
    await conn.execute('UPDATE ejemplar SET cve_estado_ejemplar=?, ubicacion=? WHERE cve_libro=? AND cve_ejemplar=?',[estado,ubicacion||'Por asignar',req.params.id,req.params.codigo]);
    await conn.execute('INSERT INTO auditoria_sistema(cve_actor,accion,entidad,identificador_entidad) VALUES(?,?,?,?)',[req.user.cve_usuario,'EDITAR_EJEMPLAR','ejemplar',req.params.codigo]);
  });res.json({mensaje:'Ejemplar actualizado'});
}));
export default r;
