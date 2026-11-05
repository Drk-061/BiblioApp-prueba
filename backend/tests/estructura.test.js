import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../src/',import.meta.url);
const leer=nombre=>fs.readFileSync(new URL(nombre,root),'utf8');
test('registro de encargados requiere configuración y aprobación',()=>{
  const code=leer('modules/auth.js');
  assert.match(code,/registro_encargados_habilitado/);
  assert.match(code,/solicitud_encargado/);
  assert.match(code,/PENDIENTE/);
});
test('no es posible auto-registrar ADMIN',()=>{
  assert.match(leer('modules/auth.js'),/\['CLIENTE','ENCARGADO'\]/);
});
test('prestamo multiejemplar utiliza SP transaccional existente',()=>{
  assert.match(leer('modules/prestamos.js'),/sp_registrar_prestamo/);
  assert.match(leer('modules/prestamos.js'),/new Set\(codigos\)/);
});
test('los QR corresponden a ejemplares físicos',()=>{
  const code=leer('modules/libros.js');
  assert.match(code,/tipo:'ejemplar'/);
  assert.match(code,/codigoEjemplar/);
  assert.match(code,/crearEjemplar/);
});
