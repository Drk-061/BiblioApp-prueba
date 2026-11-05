import {router,useLocalSearchParams} from 'expo-router';
import {useCallback,useState} from 'react';
import {Alert,Text,View} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {Pantalla,Seccion,Dato,Boton,Campo,Mensaje,fecha} from '../components/BiblioRealUI';
import {useSession} from '../context/SessionContext';
import {pedirAPI} from '../services/api';
import type {IncidenciaReal} from '../services/biblioExtra';
export default function DetalleIncidenciaStaff(){
 const {id}=useLocalSearchParams<{id?:string}>();const {token,usuario}=useSession();
 const [inc,setInc]=useState<IncidenciaReal|null>(null),[estado,setEstado]=useState<'EN_PROCESO'|'RESUELTA'>('EN_PROCESO'),[fisico,setFisico]=useState('BAJA'),[observaciones,setObservaciones]=useState(''),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false);
 const cargar=useCallback(async()=>{if(!id)return;try{const d=await pedirAPI<{incidencia:IncidenciaReal}>(`/api/incidencias/${id}`,{},token);setInc(d.incidencia);setObservaciones(d.incidencia.resolucion||'');setEstado(d.incidencia.estado==='RESUELTA'?'RESUELTA':'EN_PROCESO');setError('')}catch(e){setError((e as Error).message)}},[id,token]);
 useFocusEffect(useCallback(()=>{void cargar()},[cargar]));
 const enviar=()=>{if(!inc||observaciones.trim().length<5){Alert.alert('Observaciones requeridas','Describe el seguimiento.');return}Alert.alert('Actualizar seguimiento',`¿Registrar estado ${estado}?`,[{text:'Cancelar'},{text:'Guardar',onPress:async()=>{setOcupado(true);try{await pedirAPI(`/api/incidencias/${inc.id}/seguimiento`,{method:'PATCH',body:JSON.stringify({estado,estadoFisico:fisico,observaciones})},token);await cargar();Alert.alert('Actualizado','Cambios guardados')}catch(e){Alert.alert('Error',(e as Error).message)}finally{setOcupado(false)}}}])};
 return <Pantalla titulo="Detalle de incidencia" tab="prestamos">{!!error&&<Mensaje error={error}/>}
{!inc&&!error&&<Mensaje vacio="Cargando incidencia..."/>}{inc&&<>
 <Seccion titulo="Préstamo relacionado"><Dato nombre="Usuario" valor={`${inc.nombre} — ${inc.matricula}`}/><Dato nombre="Libro y ejemplar" valor={`${inc.titulo} — ${inc.codigoEjemplar}`}/></Seccion>
 <Seccion titulo="Datos de la incidencia"><Dato nombre="Fecha del reporte" valor={fecha(inc.fechaReporte)}/><Dato nombre="Descripción" valor={inc.descripcion}/><Dato nombre="Estado" valor={inc.estado}/></Seccion>
 <Seccion titulo="Seguimiento">{inc.estado==='RESUELTA'?<><Dato nombre="Resolución" valor={inc.resolucion}/><Dato nombre="Fecha de resolución" valor={fecha(inc.fechaResolucion)}/></>:<>
 <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Boton texto="En seguimiento" primario={estado==='EN_PROCESO'} onPress={()=>setEstado('EN_PROCESO')}/></View><View style={{flex:1}}><Boton texto="Resuelto" primario={estado==='RESUELTA'} onPress={()=>setEstado('RESUELTA')}/></View></View>
 <Campo etiqueta="Observaciones de seguimiento" valor={observaciones} cambiar={setObservaciones} multiline/>
 {estado==='RESUELTA'&&<><Text>Estado físico al resolver</Text>{['BAJA','DISPONIBLE','DANADO','EXTRAVIADO'].map(x=><Boton key={x} texto={x} primario={fisico===x} onPress={()=>setFisico(x)}/>)}</>}
 <Boton texto={ocupado?'Guardando...':'Actualizar seguimiento'} deshabilitado={ocupado||usuario?.rol==='cliente'} primario onPress={enviar}/>
 </>}</Seccion></>}</Pantalla>;
}
