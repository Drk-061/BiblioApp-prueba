import {Router} from 'express';
import {randomUUID,createHash} from 'node:crypto';
import jwt from 'jsonwebtoken';
import {pool,tx} from '../config/db.js';
import {env} from '../config/env.js';
import {auth,roles} from '../lib/auth.js';
import {asyncRoute,must} from '../lib/http.js';
const r=Router();r.use(auth);
r.post('/generar',asyncRoute(async(req,res)=>{
 const id=randomUUID(), expira=new Date(Date.now()+15*60*1000);
 const payload=jwt.sign({tipo:'credencial',cid:id,sub:req.user.cve_usuario},env.jwtSecret,{expiresIn:'15m',issuer:'biblioapp-api',audience:'biblioapp-credencial'});
 await tx(async c=>{
   await c.execute('UPDATE credencial_digital SET fecha_revocacion=NOW() WHERE cve_usuario=? AND fecha_revocacion IS NULL',[req.user.cve_usuario]);
   await c.execute('INSERT INTO credencial_digital(cve_credencial,cve_usuario,token_qr_hash,fecha_expiracion) VALUES(?,?,?,?)',
     [id,req.user.cve_usuario,createHash('sha256').update(payload).digest('hex'),expira.toISOString().slice(0,19).replace('T',' ')]);
 });
 res.json({qr:JSON.stringify({tipo:'credencial',token:payload}),fechaExpiracion:expira.toISOString()});
}));
r.post('/validar',roles('ENCARGADO','ADMIN'),asyncRoute(async(req,res)=>{
  const qr=req.body?.qr;
  must(typeof qr==='string' && qr.length<4500,400,'QR de credencial inválido.');
  let contenido;
  try {contenido=JSON.parse(qr);} catch {must(false,400,'El QR no es JSON válido.');}
  must(contenido?.tipo==='credencial' && typeof contenido.token==='string',400,'Se esperaba QR de usuario.');
  let datos;
  try {datos=jwt.verify(contenido.token,env.jwtSecret,{issuer:'biblioapp-api',audience:'biblioapp-credencial'});}
  catch {must(false,401,'Credencial QR expirada o alterada.');}
  must(datos?.tipo==='credencial' && typeof datos.cid==='string' && typeof datos.sub==='string',401,'Contenido QR inválido.');
  const hash=createHash('sha256').update(contenido.token).digest('hex');
  const [rows]=await pool.execute(`SELECT u.cve_usuario AS matricula,
   CONCAT_WS(' ',u.nombres,u.apellido_paterno,u.apellido_materno) AS nombre,
   u.estado_cuenta AS estado,u.cve_tipo_usuario AS rol
   FROM credencial_digital c JOIN usuario u ON u.cve_usuario=c.cve_usuario
   WHERE c.cve_credencial=? AND c.cve_usuario=? AND c.token_qr_hash=?
    AND c.fecha_revocacion IS NULL AND c.fecha_expiracion>NOW()`,[datos.cid,datos.sub,hash]);
  must(rows.length>0 && rows[0].estado==='ACTIVA' && rows[0].rol==='CLIENTE',403,'Credencial revocada, vencida o no corresponde a un cliente activo.');
  res.json({cliente:rows[0]});
}));
export default r;
