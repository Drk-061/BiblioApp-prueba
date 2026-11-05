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
export default r;
