
export function renderizarPlantilla(plantilla, variables={}) {
  return String(plantilla ?? '').replace(/\{\{([a-zA-Z0-9_]+)\}\}/g,
    (_coincidencia, clave)=>Object.hasOwn(variables,clave) ? String(variables[clave] ?? '').slice(0,120) : '—').slice(0,1900);
}
