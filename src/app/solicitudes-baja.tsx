import {useState} from 'react';
import {Alert,Text} from 'react-native';
import {Pantalla,Seccion,Caja,Boton,Mensaje,fecha} from '../components/BiblioRealUI';
import {useListaReal} from '../services/useListaReal';
import type {SolicitudBaja} from '../services/biblioExtra';
import {useSession} from '../context/SessionContext';
import {pedirAPI} from '../services/api';
export default function SolicitudesBaja(){
 const {usuario,token}=useSession();const {datos,cargando,error,recargar}=useListaReal<SolicitudBaja>('/api/admin/solicitudes-baja','solicitudes');
 const [ocupado,setOcupado]=useState<number|null>(null);
 const resolver=(s:SolicitudBaja,aprobar:boolean)=>Alert.alert(aprobar?'Aprobar baja':'Rechazar baja',`¿${aprobar?'Autorizar':'Rechazar'} la baja de ${s.nombre}?`,[{text:'Cancelar',style:'cancel'},{text:'Confirmar',onPress:async()=>{setOcupado(s.id);try{await pedirAPI(`/api/admin/solicitudes-baja/${s.id}`,{method:'PATCH',body:JSON.stringify({aprobar})},token);await recargar()}catch(e){Alert.alert('Error',(e as Error).message)}finally{setOcupado(null)}}}]);
 return <Pantalla titulo="Solicitudes de baja" tab="inicio"><Seccion titulo="Solicitudes de encargados">{usuario?.rol!=='admin'?<Mensaje error="Solo administrador"/>:<>{(cargando||!!error)&&<Mensaje cargando={cargando} error={error}/>}
{!datos.filter(s=>s.estado==='PENDIENTE').length&&!cargando&&<Mensaje vacio="No hay solicitudes pendientes"/>}{datos.filter(s=>s.estado==='PENDIENTE').map(s=><Caja key={s.id}><Text style={{fontWeight:'800'}}>{s.nombre}</Text><Text>Matrícula: {s.matricula}</Text><Text>Motivo: {s.motivo}</Text><Text>Fecha: {fecha(s.fecha)}</Text><Boton texto="Aceptar" primario deshabilitado={ocupado!==null} onPress={()=>resolver(s,true)}/><Boton texto="Rechazar" rojo deshabilitado={ocupado!==null} onPress={()=>resolver(s,false)}/></Caja>)}</>}</Seccion></Pantalla>;
}
