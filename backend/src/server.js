import app from './app.js';
import { pool } from './config/db.js';
import { checkEnv,env } from './config/env.js';
try {
  checkEnv();
  await pool.query('SELECT 1');
  const server=app.listen(env.port,'0.0.0.0',()=>console.log(`BiblioApp API en http://0.0.0.0:${env.port}`));
  process.on('SIGINT',()=>server.close(()=>pool.end().then(()=>process.exit(0))));
} catch(e) { console.error('No se pudo iniciar:',e.message); process.exit(1); }
