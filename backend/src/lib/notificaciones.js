import { randomUUID } from 'node:crypto';
import { pool, tx } from '../config/db.js';
import { renderizarPlantilla } from './plantillas.js';

const pushHabilitado = () => process.env.PUSH_ENABLED === 'true';

export async function enviarPush(destino,titulo,mensaje,datos={}) {
  if (!pushHabilitado()) return;
  const [dispositivos]=await pool.execute(
    'SELECT expo_token FROM dispositivo_push WHERE cve_usuario=? AND habilitado=1 LIMIT 50',[destino]);
  if (!dispositivos.length) return;
  for (let i=0;i<dispositivos.length;i+=50) {
    const tokens=dispositivos.slice(i,i+50);
    try {
      const respuesta=await fetch('https://exp.host/--/api/v2/push/send',{
        method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(tokens.map(x=>({to:x.expo_token,title:titulo,body:mensaje,sound:'default',data:datos}))),
        signal:AbortSignal.timeout(12000),
      });
      if(!respuesta.ok) throw new Error(`Expo Push HTTP ${respuesta.status}`);
      const json=await respuesta.json();
      const items=Array.isArray(json.data) ? json.data : [json.data];
      for (let j=0;j<tokens.length;j++) {
        const item=items[j];
        if(item?.details?.error==='DeviceNotRegistered') {
          await pool.execute('UPDATE dispositivo_push SET habilitado=0 WHERE expo_token=?',[tokens[j].expo_token]);
        } else if(item?.status==='error') {
          console.warn('[PUSH] Expo rechazó ticket:',item.message);
        }
      }
    }catch(error){ console.error('[PUSH] No se pudo enviar:',error.message); }
  }
}

export async function crearNotificacion({destino,tipo,prestamoId=null,variables={},evento}) {
  const result=await tx(async conexion=>{
    const [cat]=await conexion.execute('SELECT nombre_tipo,mensaje_plantilla FROM cat_tipo_notificacion WHERE cve_tipo_notificacion=?',[tipo]);
    if(!cat.length) throw new Error(`Falta tipo de notificación ${tipo}: ejecuta 02_notificaciones_y_push.sql`);
    if(evento){
      const [i]=await conexion.execute('INSERT IGNORE INTO notificacion_evento(clave_evento,cve_usuario_destino) VALUES(?,?)',[evento.slice(0,191),destino]);
      if(!i.affectedRows) return null;
    }
    const titulo=cat[0].nombre_tipo;
    const mensaje=renderizarPlantilla(cat[0].mensaje_plantilla,variables);
    const id=randomUUID();
    await conexion.execute(`INSERT INTO notificacion
      (cve_notificacion,cve_usuario_destino,cve_prestamo,cve_tipo_notificacion,titulo,mensaje)
      VALUES (?,?,?,?,?,?)`,[id,destino,prestamoId,tipo,titulo,mensaje]);
    return {id,titulo,mensaje};
  });
  if(result) await enviarPush(destino,result.titulo,result.mensaje,{tipo,prestamoId:prestamoId||''});
  return result;
}

export async function avisoSeguro(args){
  try { return await crearNotificacion(args); }
  catch(error){ console.error('[NOTIFICACIONES] No se registró un aviso:',error.message); return null; }
}

export async function enviarUltimoAviso({destino,prestamoId,tipo}){
  try {
    const [rows]=await pool.execute(`SELECT cve_notificacion,titulo,mensaje FROM notificacion
       WHERE cve_usuario_destino=? AND cve_prestamo=? AND cve_tipo_notificacion=?
       ORDER BY fecha DESC LIMIT 1`,[destino,prestamoId,tipo]);
    if(rows[0]) await enviarPush(destino,rows[0].titulo,rows[0].mensaje,{tipo,prestamoId});
  } catch(error){console.error('[PUSH] Error al buscar aviso:',error.message)}
}

export async function procesarVencimientos() {
  const [filas] = await pool.query(`SELECT p.cve_prestamo AS id,p.cve_usuario AS destino,
     DATE_FORMAT(p.fecha_limite,'%Y-%m-%d') AS fecha,
     CASE WHEN p.fecha_limite=CURRENT_DATE()+INTERVAL 1 DAY THEN 'VENCIMIENTO' ELSE 'VENCIDO' END AS tipo
    FROM prestamo p WHERE p.cve_estado_prestamo='ACTIVO'
    AND (p.fecha_limite=CURRENT_DATE()+INTERVAL 1 DAY OR p.fecha_limite<CURRENT_DATE())
    AND EXISTS(SELECT 1 FROM prestamo_detalle d WHERE d.cve_prestamo=p.cve_prestamo AND d.fecha_cierre IS NULL)
    LIMIT 2000`);
  let insertados=0;
  for(const f of filas) {
    const aviso=await avisoSeguro({destino:f.destino,tipo:f.tipo,prestamoId:f.id,
      variables:{fecha:f.fecha},evento:`${f.tipo}:${f.id}:${f.fecha}`});
    if(aviso)insertados++;
  }
  return {examinados:filas.length,insertados};
}
