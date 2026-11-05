import {router} from 'expo-router';
import {useMemo,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {Pantalla,Seccion,Caja,Boton,Mensaje,fecha,dinero} from '../components/BiblioRealUI';
import {useListaReal} from '../services/useListaReal';
import type {MultaReal} from '../services/biblioExtra';
import {COLORS} from '../constants/colors';
export default function Multas(){
 const {datos,error,cargando}=useListaReal<MultaReal>('/api/multas','multas');
 const [texto,setTexto]=useState(''),[filtro,setFiltro]=useState('TODAS');
 const visibles=useMemo(()=>datos.filter(x=>(filtro==='TODAS'||x.estado===filtro)&&`${x.titulo} ${x.codigoEjemplar} ${x.fechaGenerada}`.toLowerCase().includes(texto.toLowerCase())),[datos,texto,filtro]);
 const total=datos.filter(x=>x.estado==='PENDIENTE').reduce((acc,x)=>acc+Number(x.monto),0);
 return <Pantalla titulo="Multas" tab="prestamos"><View style={{marginBottom:12}}><TextInput value={texto} onChangeText={setTexto} placeholder="Buscar por título o fecha..." style={{borderWidth:1,borderColor:'#8BA0C8',borderRadius:8,padding:11,backgroundColor:'#FFF'}}/></View>
 <View style={{flexDirection:'row',gap:8,marginBottom:10}}>{['TODAS','PENDIENTE','PAGADA'].map(f=><Pressable key={f} onPress={()=>setFiltro(f)} style={{padding:9,borderWidth:1,borderRadius:7,backgroundColor:filtro===f?COLORS.gold:'#FFF'}}><Text style={{fontSize:11}}>{f==='TODAS'?'Todas':f==='PENDIENTE'?'Pendientes':'Pagadas'}</Text></Pressable>)}</View>
 <Seccion titulo={`Adeudo pendiente: ${dinero(total)}`}>
 {(cargando||!!error)&&<Mensaje cargando={cargando} error={error}/>}
{!cargando&&!error&&!visibles.length&&<Mensaje vacio="No se encontraron multas"/>}
 {visibles.map(m=><Caja key={m.id}><Text style={{color:COLORS.navy,fontWeight:'800',textAlign:'center'}}>{m.titulo||'Multa de préstamo'}</Text><Text style={{textAlign:'center',fontSize:12}}>Ejemplar: {m.codigoEjemplar||'—'} · Fecha: {fecha(m.fechaLimite)}</Text><Text style={{textAlign:'center',fontSize:12}}>Estado: {m.estado} · {dinero(m.monto)}</Text><Boton texto="Detalles" primario onPress={()=>router.push({pathname:'/detalle-multa',params:{id:m.id}})}/></Caja>)}
 </Seccion></Pantalla>;
}
