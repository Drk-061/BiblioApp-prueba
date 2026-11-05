import {router} from 'expo-router';
import {useMemo,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import {Pantalla,Seccion,Caja,Boton,Mensaje,fecha} from '../components/BiblioRealUI';
import {useListaReal} from '../services/useListaReal';
import {useSession} from '../context/SessionContext';
import type {PrestamoAPI} from '../services/api';
import type {MultaReal,IncidenciaReal} from '../services/biblioExtra';
import {COLORS} from '../constants/colors';
export default function HistorialPrestamos(){
 const {usuario}=useSession(),personal=usuario?.rol!=='cliente';
 const prestamos=useListaReal<PrestamoAPI>('/api/prestamos','prestamos');const multas=useListaReal<MultaReal>('/api/multas','multas');const incidencias=useListaReal<IncidenciaReal>('/api/incidencias','incidencias');
 const [q,setQ]=useState(''),[filtro,setFiltro]=useState('Todos');
 const filas=useMemo(()=>prestamos.datos.flatMap(p=>p.ejemplares.map(e=>{
  const multa=multas.datos.some(m=>m.prestamoId===p.id&&(m.detalleId===e.detalleId||m.detalleId==null));
  const incidencia=incidencias.datos.some(i=>i.detalleId===e.detalleId);
  const etiqueta=incidencia?'Con incidencia':multa?'Con multa':e.estado==='DEVUELTO'?'Devuelto':Number(p.renovaciones||0)>0?'Renovado':p.estado==='ACTIVO'?'Activo':'Cerrado';
  return {...p,ejemplar:e,etiqueta};
 })).filter(x=>(filtro==='Todos'||filtro===x.etiqueta)&&`${x.nombreUsuario} ${x.matricula} ${x.ejemplar.titulo} ${x.fechaPrestamo} ${x.fechaLimite}`.toLowerCase().includes(q.toLowerCase())),[prestamos.datos,multas.datos,incidencias.datos,filtro,q]);
 return <Pantalla titulo="Historial de Préstamos" tab="prestamos"><Seccion titulo="Búsqueda y filtros"><TextInput value={q} onChangeText={setQ} placeholder={personal?'Buscar usuario, libro o fecha...':'Buscar por título o fecha...'} style={{borderWidth:1,borderColor:'#8295C7',borderRadius:8,padding:11,backgroundColor:'#FFF'}}/>
 <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{['Todos','Activo','Devuelto','Con multa','Con incidencia','Renovado','Cerrado'].map(x=><View key={x}><Boton texto={x} primario={filtro===x} onPress={()=>setFiltro(x)}/></View>)}</View></Seccion>
 <Seccion titulo="Historial">{(prestamos.cargando||multas.cargando||incidencias.cargando)&&<Mensaje cargando/>}{!!(prestamos.error||multas.error||incidencias.error)&&<Mensaje error={prestamos.error||multas.error||incidencias.error}/>}
 {!prestamos.cargando&&!filas.length&&<Mensaje vacio="No hay registros para este filtro"/>}
 {filas.map(x=><Caja key={`${x.id}-${x.ejemplar.detalleId}`}>
 {personal&&<Text style={{color:COLORS.navy,fontWeight:'700'}}>{x.nombreUsuario} · {x.matricula}</Text>}
 <Text style={{fontWeight:'700',color:COLORS.navy}}>{x.ejemplar.titulo}</Text>
 <Text style={{fontSize:12}}>Ejemplar: {x.ejemplar.codigo}</Text><Text style={{fontSize:12}}>Fechas: {fecha(x.fechaPrestamo)} – {fecha(x.ejemplar.fechaDevolucion||x.fechaLimite)}</Text>
 <Text style={{fontSize:12}}>Estado: {x.etiqueta}</Text>
 <Boton texto="Detalles" onPress={()=>router.push({pathname:'/detalle-historial',params:{id:x.id,codigo:x.ejemplar.codigo}})}/></Caja>)}
 </Seccion></Pantalla>;
}
