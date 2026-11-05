import app from './app.js';
import {procesarVencimientos} from './lib/notificaciones.js';
import { pool } from './config/db.js';
import { checkEnv,env } from './config/env.js';
try {
  checkEnv();
  await pool.query('SELECT 1');
  const server=app.listen(env.port,'0.0.0.0',()=>console.log(`BiblioApp API en http://0.0.0.0:${env.port}`));
  const revisar=async()=>{try{const r=await procesarVencimientos();console.log('[Avisos automáticos]',r)}catch(e){console.error('[Avisos automáticos]',e.message)}};
  await revisar();
  const intervalo=setInterval(revisar,60*60*1000);intervalo.unref();
  process.on('SIGINT',()=>{clearInterval(intervalo);server.close(()=>pool.end().then(()=>process.exit(0)))});
} catch(e) { console.error('No se pudo iniciar:',e.message); process.exit(1); }
