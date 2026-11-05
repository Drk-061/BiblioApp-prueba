export class HttpError extends Error {
  constructor(status, mensaje, code = 'ERROR') { super(mensaje); this.status = status; this.code = code; }
}
export const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next);
export function must(cond, status, mensaje, code) { if (!cond) throw new HttpError(status,mensaje,code); }
export function text(value, max=200) { return typeof value === 'string' ? value.trim().slice(0,max) : ''; }
export function assertString(value, label, min=1, max=200) {
  const s = text(value,max+1); must(s.length>=min && s.length<=max,400,`${label}: debe tener entre ${min} y ${max} caracteres`);
  return s;
}
export function sqlErrorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ mensaje:err.message, codigo:err.code });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje:'Ya existe un registro con ese valor (matrícula, correo, ISBN o ejemplar).' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(422).json({ mensaje:'No existe un registro relacionado (categoría, usuario o libro).' });
  if (err.sqlState === '45000') return res.status(409).json({ mensaje:err.sqlMessage || 'Operación rechazada por una regla de biblioteca.' });
  console.error('ERROR INTERNO',err);
  return res.status(500).json({ mensaje:'Error interno del servidor.' });
}
