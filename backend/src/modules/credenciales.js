import {Router} from 'express';
import {randomUUID,createHash} from 'node:crypto';
import jwt from 'jsonwebtoken';
import {pool,tx} from '../config/db.js';
import {env} from '../config/env.js';
import {auth} from '../lib/auth.js';
import {asyncRoute} from '../lib/http.js';
const r=Router();r.use(auth);
// La lectura/validación del QR queda fuera de este avance. El código es temporal y firmado.
r.post('/generar',asyncRoute(async(req,res)=>{
 const id=randomUUID(), expira=new Date(Date.now()+15*60*1000);
 const payload=jwt.sign({tipo:'credencial',cid:id,sub:req.user.cve_usuario},env.jwtSecret,{expiresIn:'15m',issuer:'biblioapp-api'});
 await tx(async c=>{
   await c.execute('UPDATE credencial_digital SET fecha_revocacion=NOW() WHERE cve_usuario=? AND fecha_revocacion IS NULL',[req.user.cve_usuario]);
   await c.execute('INSERT INTO credencial_digital(cve_credencial,cve_usuario,token_qr_hash,fecha_expiracion) VALUES(?,?,?,?)',
     [id,req.user.cve_usuario,createHash('sha256').update(payload).digest('hex'),expira.toISOString().slice(0,19).replace('T',' ')]);
 });
 res.json({qr:JSON.stringify({tipo:'credencial',token:payload}),fechaExpiracion:expira.toISOString()});
}));
export default r;
