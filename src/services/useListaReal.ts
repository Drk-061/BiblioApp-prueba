import {useCallback,useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {pedirAPI} from './api';
import {useSession} from '../context/SessionContext';
export function useListaReal<T>(ruta:string,clave:string){
 const {token}=useSession();const [datos,setDatos]=useState<T[]>([]);const [cargando,setCargando]=useState(true);const [error,setError]=useState('');
 const recargar=useCallback(async()=>{
  if(!token) {setError('Inicia sesión para consultar esta información');setCargando(false);return;}
  setCargando(true);
  try {const d=await pedirAPI<Record<string,T[]>>(ruta,{},token);setDatos(d[clave]||[]);setError('');}
  catch(e){setError((e as Error).message);setDatos([])}finally{setCargando(false)}
 },[ruta,clave,token]);
 useFocusEffect(useCallback(()=>{void recargar()},[recargar]));
 return {datos,cargando,error,recargar,setDatos};
}
