import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { checkEnv } from '../config/env.js';
const matricula=process.env.ADMIN_MATRICULA?.trim().toUpperCase();
const nombres=process.env.ADMIN_NOMBRES?.trim();
const apellido=process.env.ADMIN_APELLIDO?.trim();
const correo=process.env.ADMIN_CORREO?.trim().toLowerCase();
const password=process.env.ADMIN_PASSWORD;
let conn;
try {
  checkEnv();
  if (!matricula||!nombres||!apellido||!correo||!password||password.length<12||password.includes('CAMBIAR'))
    throw new Error('Configura ADMIN_MATRICULA, ADMIN_NOMBRES, ADMIN_APELLIDO, ADMIN_CORREO y ADMIN_PASSWORD (12+ caracteres únicos) en .env');
  conn=await pool.getConnection();await conn.beginTransaction();
  const [existe]=await conn.execute('SELECT cve_usuario FROM usuario WHERE cve_usuario=? FOR UPDATE',[matricula]);
  if(existe.length) { console.log('La cuenta ya existe. No se modificaron credenciales.');await conn.rollback();process.exitCode=0; }
  else {
    const hash=await bcrypt.hash(password,12);
    await conn.execute(`INSERT INTO usuario(cve_usuario,nombres,apellido_paterno,correo,contrasena_hash,cve_tipo_usuario,estado_cuenta)
      VALUES (?,?,?,?,?,'ADMIN','ACTIVA')`,[matricula,nombres,apellido,correo,hash]);
    await conn.commit();console.log('Cuenta ADMIN inicial creada. Cambia la contraseña antes de producción.');
  }
} catch(e) { if(conn)await conn.rollback(); console.error(e.message);process.exitCode=1; }
finally { if(conn)conn.release();await pool.end(); }
