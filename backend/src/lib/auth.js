import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { HttpError } from './http.js';
export function issueToken(user) {
  return jwt.sign({ sub:user.cve_usuario }, env.jwtSecret, { expiresIn:'8h', issuer:'biblioapp-api' });
}
export async function auth(req, _res, next) {
  try {
    const match = /^Bearer (.+)$/i.exec(req.headers.authorization || '');
    if (!match) throw new HttpError(401,'Debes iniciar sesión.');
    const payload = jwt.verify(match[1], env.jwtSecret, { issuer:'biblioapp-api' });
    const [rows] = await pool.execute(
      'SELECT cve_usuario,nombres,apellido_paterno,apellido_materno,correo,cve_tipo_usuario,estado_cuenta FROM usuario WHERE cve_usuario=?',
      [payload.sub]
    );
    const user = rows[0];
    if (!user || user.estado_cuenta !== 'ACTIVA') throw new HttpError(401,'Cuenta inactiva o sesión inválida.');
    req.user = user;
    next();
  } catch(e) { next(e.name==='JsonWebTokenError'||e.name==='TokenExpiredError'?new HttpError(401,'Sesión inválida o expirada.'):e); }
}
export const roles = (...allowed) => (req,_res,next) => allowed.includes(req.user?.cve_tipo_usuario)
  ? next() : next(new HttpError(403,'Tu rol no tiene permiso para esta acción.'));
export function publicUser(u) {
  return { matricula:u.cve_usuario, nombres:u.nombres, apellidoPaterno:u.apellido_paterno,
    apellidoMaterno:u.apellido_materno, correo:u.correo,
    nombre:[u.nombres,u.apellido_paterno,u.apellido_materno].filter(Boolean).join(' '),
    rol:u.cve_tipo_usuario.toLowerCase(), estado:u.estado_cuenta };
}
