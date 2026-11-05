import {router,useLocalSearchParams} from 'expo-router';
import {useCallback,useState} from 'react';
import {Alert,Text,View} from 'react-native';
import {Pantalla,Seccion,Dato,Boton,Mensaje,fecha,dinero} from '../components/BiblioRealUI';
import {pedirAPI} from '../services/api';
import {useSession} from '../context/SessionContext';
import {useFocusEffect} from 'expo-router';
import type {MultaReal} from '../services/biblioExtra';
export default function DetalleMulta(){
 const {id,prestamoId}=useLocalSearchParams<{id?:string;prestamoId?:string}>();
 const {usuario,token}=useSession();const [m,setM]=useState<MultaReal|null>(null),[error,setError]=useState(''),[guardando,setGuardando]=useState(false);
 const cargar=useCallback(async()=>{try{
  if(id){const d=await pedirAPI<{multa:MultaReal}>(`/api/multas/${encodeURIComponent(id)}`,{},token);setM(d.multa)}
  else {const d=await pedirAPI<{multas:MultaReal[]}>('/api/multas',{},token);setM(d.multas.find(x=>x.prestamoId===prestamoId)||null)}setError('');
 }catch(e){setError((e as Error).message)}},[id,prestamoId,token]);
 useFocusEffect(useCallback(()=>{void cargar()},[cargar]));
 const pagar=()=>Alert.alert('Actualizar estado de multa',`¿Confirmas que la multa de ${dinero(m?.monto)} fue pagada?`,[{text:'Cancelar',style:'cancel'},{text:'Confirmar',onPress:async()=>{if(!m)return;setGuardando(true);try{await pedirAPI(`/api/multas/${m.id}/pagar`,{method:'PATCH',body:JSON.stringify({referencia:'Pago recibido en biblioteca'})},token);await cargar()}catch(e){Alert.alert('Error',(e as Error).message)}finally{setGuardando(false)}}}]);
 return <Pantalla titulo="Detalle de multa" tab="prestamos">{!!error&&<Mensaje error={error}/>}
{!m&&!error&&<Mensaje vacio="No se encontró multa relacionada"/>}{m&&<>
 <Seccion titulo="Préstamo relacionado"><Dato nombre="Usuario" valor={`${m.nombre} — ${m.matricula}`}/><Dato nombre="Libro / Ejemplar" valor={`${m.titulo||'—'} / ${m.codigoEjemplar||'—'}`}/><Dato nombre="Límite y devolución" valor={`${fecha(m.fechaLimite)} / ${fecha(m.fechaDevolucion)}`}/></Seccion>
 <Seccion titulo="Datos de la multa"><Dato nombre="Motivo" valor={m.descripcion||m.motivo}/><Dato nombre="Días de retraso" valor={m.diasRetraso}/><Dato nombre="Monto" valor={dinero(m.monto)}/><Dato nombre="Estado" valor={m.estado}/></Seccion>
 <Seccion titulo="Registro"><Dato nombre="Generada" valor={fecha(m.fechaGenerada)}/>{!!m.fechaPago&&<Dato nombre="Fecha de pago" valor={fecha(m.fechaPago)}/>}</Seccion>
 {usuario?.rol!=='cliente'&&m.estado==='PENDIENTE'&&<Boton texto={guardando?'Guardando...':'Marcar pagada'} deshabilitado={guardando} onPress={pagar}/>}
 </>}</Pantalla>;
}
