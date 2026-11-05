import mysql from 'mysql2/promise';
import { env } from './env.js';
export const pool = mysql.createPool(env.db);
export async function tx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally { conn.release(); }
}
