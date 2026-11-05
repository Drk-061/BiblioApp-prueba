import {router,useLocalSearchParams} from 'expo-router';
import {Alert,Text,View,TextInput} from 'react-native';
import {useState} from 'react';
import {Pantalla,Seccion,Dato,Boton,Mensaje,fecha} from '../components/BiblioRealUI';
import {useListaReal} from '../services/useListaReal';
import {useSession} from '../context/SessionContext';
import {pedirAPI,type PrestamoAPI} from '../services/api';
import type {MultaReal,IncidenciaReal} from '../services/biblioExtra';
export default function DetallePrestamo(){
 const {id,codigo}=useLocalSearchParams<{id?:string;codigo?:string}>();const {usuario,token}=useSession();
 const [monto,setMonto]=useState(''),[descripcion,setDescripcion]=useState('');
 const ps=useListaReal<PrestamoAPI>('/api/prestamos','prestamos');
 const multas=useListaReal<MultaReal>('/api/multas','multas');
 const incidencias=useListaReal<IncidenciaReal>('/api/incidencias','incidencias');
 const p=ps.datos.find(x=>x.id===id),e=p?.ejemplares.find(x=>x.codigo===codigo)||p?.ejemplares[0];
 const multa=multas.datos.find(x=>x.prestamoId===id&&(x.detalleId===e?.detalleId||x.detalleId===null));
 const incidencia=incidencias.datos.find(x=>x.detalleId===e?.detalleId);
 return <Pantalla titulo="Detalle del préstamo" tab="prestamos">
 {(ps.cargando||multas.cargando||incidencias.cargando)&&<Mensaje cargando/>}
 {!!(ps.error||multas.error||incidencias.error)&&<Mensaje error={ps.error||multas.error||incidencias.error}/>}
 {!ps.cargando&&!p&&<Mensaje vacio="No se encontró el préstamo"/>}
 {p&&e&&<>
 <Seccion titulo={usuario?.rol==='cliente'?'Libro':'Identificar usuario'}>{usuario?.rol==='cliente'?<Dato nombre="Libro" valor={`${e.titulo}\n${e.autor}\nEjemplar: ${e.codigo}`}/>:<Dato nombre="Usuario" valor={`${p.nombreUsuario}\nMatrícula: ${p.matricula}`}/>}</Seccion>
 {usuario?.rol!=='cliente'&&<Seccion titulo="Ejemplar"><Dato nombre="Libro" valor={`${e.titulo} — ${e.autor}`}/><Dato nombre="Clave" valor={e.codigo}/><Dato nombre="Estado del ejemplar" valor={e.estado}/></Seccion>}
 <Seccion titulo="Datos del préstamo"><Dato nombre="Fecha de préstamo" valor={fecha(p.fechaPrestamo)}/><Dato nombre="Fecha límite" valor={fecha(p.fechaLimite)}/><Dato nombre="Estado" valor={p.estado}/>{e.fechaDevolucion&&<Dato nombre="Devolución" valor={fecha(e.fechaDevolucion)}/>}</Seccion>
 {usuario?.rol==='cliente'&&<>
  <Seccion titulo="Renovación"><Dato nombre="Fecha actual límite" valor={fecha(p.fechaLimite)}/><Boton texto="Renovar préstamo" deshabilitado={p.estado!=='ACTIVO'||e.estado!=='PRESTADO'} onPress={()=>router.push({pathname:'/renovar-prestamo',params:{id:p.id}})}/></Seccion>
  <Seccion titulo="¿Tuviste un problema con el ejemplar?"><Boton texto="Reportar extravío" deshabilitado={e.estado!=='PRESTADO'||!!incidencia} onPress={()=>router.push({pathname:'/reportar-extravio',params:{id:p.id,codigo:e.codigo}})}/></Seccion>
 </>}
 <Seccion titulo="Multa">{multa?<><Dato nombre="Estado / Monto" valor={`${multa.estado} / $${Number(multa.monto).toFixed(2)}`}/><Boton texto="Ver multa" primario onPress={()=>router.push({pathname:'/detalle-multa',params:{id:multa.id}})}/></>:<><Dato nombre="Resultado" valor="No existe multa"/>
 {usuario?.rol!=='cliente'&&<>
 <Text style={{fontSize:12,color:'#445'}}>Para registrar una multa, ingresa un importe autorizado por la biblioteca.</Text>
 <TextInput placeholder="Monto de multa (MXN)" keyboardType="decimal-pad" value={monto} onChangeText={setMonto} style={{borderWidth:1,borderColor:'#9AAAC8',padding:10,borderRadius:7}}/>
 <TextInput placeholder="Motivo / observaciones" value={descripcion} onChangeText={setDescripcion} style={{borderWidth:1,borderColor:'#9AAAC8',padding:10,borderRadius:7}}/>
 <Boton texto="Registrar multa" onPress={()=>Alert.alert('Confirmar multa',`¿Registrar una multa de $${monto}?`,[{text:'Cancelar'},{text:'Confirmar',onPress:async()=>{try{await pedirAPI('/api/multas',{method:'POST',body:JSON.stringify({detalleId:e.detalleId,monto:Number(monto),motivo:'OTRO',descripcion})},token);await multas.recargar();setMonto('');setDescripcion('')}catch(err){Alert.alert('Error',(err as Error).message)}}}])}/>
 </>}
 </>}</Seccion>
 <Seccion titulo="Incidencia">{incidencia?<><Dato nombre="Estado" valor={incidencia.estado}/>{usuario?.rol!=='cliente'&&<Boton primario texto="Ver incidencia" onPress={()=>router.push({pathname:'/detalle-incidencia-staff',params:{id:incidencia.id}})}/>}</>:<Dato nombre="Resultado" valor="No existe incidencia"/>}</Seccion>
 {usuario?.rol!=='cliente'&&e.estado==='PRESTADO'&&<Boton texto="Registrar devolución" primario onPress={()=>router.push({pathname:'/devolucion-prestamo',params:{id:p.id,codigo:e.codigo}})}/>}
 </>}
 </Pantalla>;
}
