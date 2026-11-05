import {router,useFocusEffect,useLocalSearchParams} from 'expo-router';
import {useCallback,useState} from 'react';
import {Alert} from 'react-native';
import {Pantalla,Seccion,Dato,Boton,Mensaje,dinero} from '../components/BiblioRealUI';
import {useSession} from '../context/SessionContext';
import {pedirAPI} from '../services/api';
import type {UsuarioGestion} from '../services/biblioExtra';
export default function DetalleUsuario(){
 const {id}=useLocalSearchParams<{id?:string}>();const {usuario,token}=useSession();
 const [u,setU]=useState<UsuarioGestion|null>(null),[error,setError]=useState(''),[ocupado,setOcupado]=useState(false);
 const cargar=useCallback(async()=>{if(!id)return;try{const d=await pedirAPI<{usuario:UsuarioGestion}>(`/api/usuarios/${encodeURIComponent(id)}`,{},token);setU(d.usuario);setError('')}catch(e){setError((e as Error).message)}},[id,token]);
 useFocusEffect(useCallback(()=>{void cargar()},[cargar]));
 const baja=()=>{if(!u)return;
 const solicitar=u.rol==='ENCARGADO'&&usuario?.rol==='encargado';
 if(u.prestamosActivos>0||Number(u.adeudo)>0){Alert.alert('No es posible dar de baja',`Préstamos activos: ${u.prestamosActivos}\nAdeudo: ${dinero(u.adeudo)}\nRegulariza estas operaciones.`);return}
 Alert.alert(solicitar?'Solicitar autorización':'Confirmar baja',solicitar?`¿Solicitar al administrador la baja de ${u.nombre}?`:`¿Dar de baja la cuenta de ${u.nombre}?`,[{text:'Cancelar',style:'cancel'},{text:'Continuar',style:'destructive',onPress:async()=>{setOcupado(true);try{await pedirAPI(`/api/usuarios/${u.matricula}${solicitar?'/solicitar-baja':'/baja'}`,{method:solicitar?'POST':'PATCH',...(solicitar?{body:JSON.stringify({motivo:`Solicitud de baja de ${u.nombre}`})}:{})},token);Alert.alert(solicitar?'Solicitud enviada':'Baja realizada',solicitar?'Pendiente de autorización':'La cuenta quedó inactiva');await cargar()}catch(e){Alert.alert('Error',(e as Error).message)}finally{setOcupado(false)}}}]);
 };
 return <Pantalla titulo="Detalle del usuario" tab="inicio">{!!error&&<Mensaje error={error}/>}
{!u&&!error&&<Mensaje vacio="Cargando datos..."/>}{u&&<>
 <Seccion titulo="Datos del usuario"><Dato nombre="Nombre" valor={u.nombre}/><Dato nombre="Matrícula" valor={u.matricula}/><Dato nombre="Correo" valor={u.correo}/><Dato nombre="Tipo de usuario" valor={u.rol}/><Dato nombre="Estado" valor={u.estado}/></Seccion>
 <Seccion titulo="Resumen"><Dato nombre="Préstamos activos" valor={u.prestamosActivos}/><Dato nombre="Adeudos" valor={dinero(u.adeudo)}/></Seccion>
 <Boton texto="Ver préstamos" onPress={()=>router.push({pathname:'/prestamos',params:{usuarioBuscar:u.matricula}})}/>
 {u.estado==='ACTIVA'&&usuario?.rol!=='cliente'&&<Boton texto={ocupado?'Procesando...':'Dar de baja usuario'} deshabilitado={ocupado} rojo onPress={baja}/>}
 </>}</Pantalla>;
}
