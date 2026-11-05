import {router,useLocalSearchParams} from 'expo-router';
import {useState} from 'react';
import {Alert} from 'react-native';
import {Pantalla,Seccion,Dato,Boton,Mensaje,fecha} from '../components/BiblioRealUI';
import {useListaReal} from '../services/useListaReal';
import type {PrestamoAPI} from '../services/api';
import {pedirAPI} from '../services/api';
import {useSession} from '../context/SessionContext';
export default function RenovarPrestamo(){
 const {id}=useLocalSearchParams<{id?:string}>();const {token,usuario}=useSession();const {datos,cargando,error}=useListaReal<PrestamoAPI>('/api/prestamos','prestamos');const [ocupado,setOcupado]=useState(false);
 const p=datos.find(x=>x.id===id);
 const guardar=()=>Alert.alert('Confirmar renovación','La nueva fecha la establecerá la política de MySQL.',[{text:'Cancelar',style:'cancel'},{text:'Renovar',onPress:async()=>{if(!p)return;setOcupado(true);try{await pedirAPI(`/api/prestamos/${p.id}/renovar`,{method:'POST'},token);Alert.alert('Renovación registrada','La fecha límite quedó actualizada.',[{text:'Volver a préstamos',onPress:()=>router.replace('/prestamos')}])}catch(e){Alert.alert('Renovación no permitida',(e as Error).message)}finally{setOcupado(false)}}}]);
 return <Pantalla titulo="Renovar Préstamo" tab="prestamos">{(cargando||!!error)&&<Mensaje cargando={cargando} error={error}/>}
{p&&<>
 <Seccion titulo="Datos del préstamo"><Dato nombre="Préstamo" valor={fecha(p.fechaPrestamo)}/><Dato nombre="Fecha límite actual" valor={fecha(p.fechaLimite)}/><Dato nombre="Estado" valor={p.estado}/></Seccion>
 <Seccion titulo="Usuario"><Dato nombre="Nombre" valor={p.nombreUsuario}/><Dato nombre="Matrícula" valor={p.matricula}/></Seccion>
 <Seccion titulo="Ejemplares">{p.ejemplares.map(e=><Dato key={e.detalleId} nombre={e.codigo} valor={`${e.titulo} — ${e.estado}`}/>)}</Seccion>
 <Seccion titulo="Renovación del préstamo"><Dato nombre="Nueva fecha límite" valor="Se calcula automáticamente al confirmar"/><Boton texto={ocupado?'Registrando...':'Renovar préstamo'} primario onPress={guardar} deshabilitado={ocupado||usuario?.rol!=='cliente'||p.estado!=='ACTIVO'}/><Boton texto="Cancelar" onPress={()=>router.back()}/></Seccion>
 </>}</Pantalla>;
}
