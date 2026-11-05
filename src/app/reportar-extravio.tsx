import {router,useLocalSearchParams} from 'expo-router';
import {useState} from 'react';
import {Alert} from 'react-native';
import {Pantalla,Seccion,Dato,Boton,Campo,Mensaje,fecha} from '../components/BiblioRealUI';
import {useListaReal} from '../services/useListaReal';
import {pedirAPI,type PrestamoAPI} from '../services/api';
import {useSession} from '../context/SessionContext';
export default function ReportarExtravio(){
 const {id,codigo}=useLocalSearchParams<{id?:string;codigo?:string}>();const {token}=useSession();const {datos,cargando,error}=useListaReal<PrestamoAPI>('/api/prestamos','prestamos');
 const [descripcion,setDescripcion]=useState(''),[ocupado,setOcupado]=useState(false);
 const p=datos.find(x=>x.id===id),e=p?.ejemplares.find(x=>x.codigo===codigo)||p?.ejemplares[0];
 const reportar=()=>{if(!e||descripcion.trim().length<10){Alert.alert('Información incompleta','Explica el extravío con al menos 10 caracteres.');return}Alert.alert('Confirmar reporte','El ejemplar se marcará como extraviado y se notificará al personal.',[{text:'Cancelar'},{text:'Enviar reporte',onPress:async()=>{setOcupado(true);try{await pedirAPI('/api/incidencias',{method:'POST',body:JSON.stringify({detalleId:e.detalleId,descripcion})},token);Alert.alert('Reporte enviado','Tu incidencia se guardó en MySQL.',[{text:'Aceptar',onPress:()=>router.replace('/prestamos')}])}catch(err){Alert.alert('Error',(err as Error).message)}finally{setOcupado(false)}}}])};
 return <Pantalla titulo="Reportar Extravío" tab="prestamos">{(cargando||!!error)&&<Mensaje cargando={cargando} error={error}/>}
{p&&e&&<>
 <Seccion titulo="Datos del préstamo"><Dato nombre="Fecha de préstamo" valor={fecha(p.fechaPrestamo)}/><Dato nombre="Fecha límite" valor={fecha(p.fechaLimite)}/><Dato nombre="Estado" valor={p.estado}/></Seccion>
 <Seccion titulo="Usuario"><Dato nombre="Nombre" valor={p.nombreUsuario}/><Dato nombre="Matrícula" valor={p.matricula}/></Seccion>
 <Seccion titulo="Ejemplar"><Dato nombre="Libro" valor={e.titulo}/><Dato nombre="Ejemplar" valor={e.codigo}/><Dato nombre="Estado" valor={e.estado}/></Seccion>
 <Seccion titulo="Detalles de la incidencia"><Dato nombre="Fecha del reporte" valor={fecha(new Date().toISOString())}/><Campo etiqueta="Descripción de lo ocurrido" valor={descripcion} cambiar={setDescripcion} multiline/></Seccion>
 <Seccion titulo="Reportar extravío"><Boton primario texto={ocupado?'Enviando...':'Reportar'} deshabilitado={ocupado||e.estado!=='PRESTADO'} onPress={reportar}/><Boton texto="Cancelar" onPress={()=>router.back()}/></Seccion>
 </>}</Pantalla>;
}
