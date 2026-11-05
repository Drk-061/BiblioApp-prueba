import {router} from 'expo-router';
import {useMemo,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import {Pantalla,Seccion,Caja,Boton,Mensaje} from '../components/BiblioRealUI';
import {useListaReal} from '../services/useListaReal';
import type {UsuarioGestion} from '../services/biblioExtra';
import {useSession} from '../context/SessionContext';
import {COLORS} from '../constants/colors';
export default function Usuarios(){
 const {usuario}=useSession();const {datos,cargando,error}=useListaReal<UsuarioGestion>('/api/usuarios','usuarios');
 const [q,setQ]=useState(''),[filtro,setFiltro]=useState('Todos');
 const visibles=useMemo(()=>datos.filter(u=>(filtro==='Todos'||u.rol===(filtro==='Clientes'?'CLIENTE':'ENCARGADO'))&&`${u.nombre} ${u.matricula}`.toLowerCase().includes(q.toLowerCase())),[datos,filtro,q]);
 return <Pantalla titulo="Usuarios" tab="inicio"><Seccion titulo="Buscar usuarios"><TextInput placeholder="Buscar por nombre o matrícula..." value={q} onChangeText={setQ} style={{borderWidth:1,borderColor:'#8AA0C8',borderRadius:8,padding:11,backgroundColor:'#FFF'}}/>
 <View style={{flexDirection:'row',gap:8}}>{['Todos','Clientes','Encargados'].map(x=><View key={x} style={{flex:1}}><Boton texto={x} primario={filtro===x} onPress={()=>setFiltro(x)}/></View>)}</View></Seccion>
 <Seccion titulo="Lista de usuarios">{usuario?.rol==='cliente'?<Mensaje error="No autorizado"/>:<>{(!!error||cargando)&&<Mensaje error={error} cargando={cargando}/>}
{!visibles.length&&!cargando&&<Mensaje vacio="Sin registros"/>}{visibles.map(x=><Caja key={x.matricula}><Text style={{fontWeight:'800',color:COLORS.navy}}>{x.nombre}</Text><Text style={{fontSize:12}}>Matrícula: {x.matricula} · {x.rol}</Text><Text style={{fontSize:12}}>Estado: {x.estado}</Text><Boton texto="Detalles" onPress={()=>router.push({pathname:'/detalle-usuario',params:{id:x.matricula}})}/></Caja>)}</>}</Seccion>
 {usuario?.rol==='admin'&&<Boton texto="Solicitudes de baja" primario onPress={()=>router.push('/solicitudes-baja')}/>}</Pantalla>;
}
