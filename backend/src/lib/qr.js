
export const qrEjemplar = codigoEjemplar => JSON.stringify({tipo:'ejemplar',codigoEjemplar});
export function leerQREjemplar(entrada) {
  if(typeof entrada!=='string' || entrada.length>1000) throw new Error('QR de ejemplar inválido');
  let valor;
  try {valor=JSON.parse(entrada);} catch {throw new Error('El QR no contiene JSON válido');}
  if(valor?.tipo!=='ejemplar' || typeof valor.codigoEjemplar!=='string') throw new Error('Se esperaba un QR de ejemplar');
  const codigo=valor.codigoEjemplar.trim().toUpperCase();
  if(!/^[A-Z0-9-]{3,36}$/.test(codigo))throw new Error('Código inválido');
  return codigo;
}
