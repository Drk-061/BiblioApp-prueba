import {useMemo,useState} from 'react';
import {Alert,Pressable,Text,View} from 'react-native';
import {Pantalla,Seccion,Caja,Mensaje,fecha} from '../components/BiblioRealUI';
import {useListaReal} from '../services/useListaReal';
import type {AvisoReal} from '../services/biblioExtra';
import {useSession} from '../context/SessionContext';
import {activarNotificacionesPush} from '../services/push';
import {pedirAPI} from '../services/api';
import {COLORS} from '../constants/colors';
export default function Avisos(){
 const {token}=useSession();const {datos,error,cargando,recargar}=useListaReal<AvisoReal>('/api/avisos','avisos');
 const [filtro,setFiltro]=useState<'todos'|'no_leidos'>('todos');
 const lista=useMemo(()=>datos.filter(x=>filtro==='todos'||!x.leida),[datos,filtro]);
 const marcar=async(id:string)=>{try{await pedirAPI(`/api/avisos/${encodeURIComponent(id)}/leer`,{method:'PATCH'},token);await recargar()}catch(e){Alert.alert('Error',(e as Error).message)}};
 const hoy=new Date().toISOString().slice(0,10);const ayer=new Date(Date.now()-86400000).toISOString().slice(0,10);
 const grupos=[{titulo:'Hoy',items:lista.filter(x=>x.fecha.slice(0,10)===hoy)},{titulo:'Ayer',items:lista.filter(x=>x.fecha.slice(0,10)===ayer)},{titulo:'Anteriores',items:lista.filter(x=>![hoy,ayer].includes(x.fecha.slice(0,10)))}];
 return <Pantalla titulo="Avisos" tab="inicio">
 <View style={{flexDirection:'row',gap:14,justifyContent:'center',marginBottom:13}}>{(['todos','no_leidos'] as const).map(x=><Pressable key={x} onPress={()=>setFiltro(x)} style={{paddingVertical:9,paddingHorizontal:23,borderWidth:1.5,borderRadius:6,borderColor:COLORS.navy,backgroundColor:filtro===x?COLORS.gold:'#FFF'}}><Text style={{fontWeight:'700',color:COLORS.navy}}>{x==='todos'?'Todos':'No leídos'}</Text></Pressable>)}</View>
 <Seccion titulo="Notificaciones">
 <Pressable onPress={async()=>{try{if(!token)throw new Error('Inicia sesión para activar avisos');await activarNotificacionesPush(token);Alert.alert('Notificaciones activadas','Este dispositivo recibirá avisos push cuando se configuren las credenciales de Expo.')}catch(e){Alert.alert('Activación de push',(e as Error).message)}}}
 style={{backgroundColor:COLORS.gold,borderRadius:8,padding:12,alignItems:'center',marginBottom:10}}>
 <Text style={{fontWeight:'800',color:COLORS.navy}}>Activar avisos en mi teléfono</Text>
 </Pressable>{(cargando||!!error)&&<Mensaje cargando={cargando} error={error}/>}{!cargando&&!error&&!lista.length&&<Mensaje vacio="No hay avisos para este filtro"/>}
 {grupos.filter(g=>g.items.length).map(g=><View key={g.titulo} style={{gap:8,marginBottom:13}}><Text style={{fontSize:14,fontWeight:'800',color:COLORS.navy}}>{g.titulo}</Text>{g.items.map(a=><Pressable key={a.id} onPress={()=>!a.leida&&marcar(a.id)}><Caja><View style={{backgroundColor:a.leida?'#FFF':'#EDF2FF',padding:8,borderRadius:7}}><Text style={{fontWeight:'800',color:COLORS.navy,fontSize:12,textAlign:'center'}}>{a.titulo}{a.leida?'':' •'}</Text><Text style={{fontSize:12,textAlign:'center',marginVertical:8}}>{a.mensaje}</Text><Text style={{fontSize:10,textAlign:'center',color:'#667'}}>{fecha(a.fecha)} · {a.leida?'Leído':'Nuevo · Tocar para marcar leído'}</Text></View></Caja></Pressable>)}</View>)}
 </Seccion></Pantalla>;
}
