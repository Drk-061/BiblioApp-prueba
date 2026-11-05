import {Router} from 'express';
import {pool} from '../config/db.js';
import {auth} from '../lib/auth.js';
import {asyncRoute,must} from '../lib/http.js';
const r=Router();r.use(auth);
r.get('/',asyncRoute(async(req,res)=>{
 const [rows]=await pool.execute(`SELECT cve_notificacion AS id,cve_tipo_notificacion AS tipo,titulo,mensaje,fecha,leida
 FROM notificacion WHERE cve_usuario_destino=? ORDER BY fecha DESC LIMIT 200`,[req.user.cve_usuario]);
 res.json({avisos:rows.map(a=>({...a,leida:!!a.leida}))});
}));
r.patch('/:id/leer',asyncRoute(async(req,res)=>{
 const [r0]=await pool.execute('UPDATE notificacion SET leida=TRUE WHERE cve_notificacion=? AND cve_usuario_destino=?',[req.params.id,req.user.cve_usuario]);
 must(r0.affectedRows>0,404,'Aviso no encontrado');res.json({mensaje:'Aviso leído'});
}));
const TOKEN_RE=/^(Expo|Exponent)PushToken\[[A-Za-z0-9_-]{8,}\]$/;
r.post('/dispositivos',asyncRoute(async(req,res)=>{
 const token=req.body?.expoToken;
 must(typeof token==='string'&&token.length<=255&&TOKEN_RE.test(token),400,'Expo push token no válido');
 await pool.execute(`INSERT INTO dispositivo_push (cve_usuario,expo_token,habilitado)
 VALUES (?,?,1) ON DUPLICATE KEY UPDATE cve_usuario=VALUES(cve_usuario),habilitado=1`,[req.user.cve_usuario,token]);
 res.json({mensaje:'Dispositivo registrado para avisos push'});
}));
r.delete('/dispositivos',asyncRoute(async(req,res)=>{
 const token=req.body?.expoToken;
 must(typeof token==='string'&&token.length<=255,400,'Falta expoToken');
 await pool.execute('DELETE FROM dispositivo_push WHERE cve_usuario=? AND expo_token=?',[req.user.cve_usuario,token]);
 res.json({mensaje:'Dispositivo desvinculado'});
}));
export default r;
