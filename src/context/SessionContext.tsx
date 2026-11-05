import React, { createContext,useContext,useEffect,useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { pedirAPI, type Usuario } from '../services/api';
import { setRolSesion } from '../constants/rolDemo';
const TOKEN_KEY='biblioapp_mvp_token';
type Sesion = {
  token: string|null; usuario: Usuario|null; cargando:boolean;
  login: (matricula:string,contrasena:string)=>Promise<void>;
  logout: ()=>Promise<void>;
};
const Contexto=createContext<Sesion|null>(null);
export function SessionProvider({children}:{children:ReactNode}) {
  const [token,setToken]=useState<string|null>(null);
  const [usuario,setUsuario]=useState<Usuario|null>(null);
  const [cargando,setCargando]=useState(true);
  useEffect(()=>{
    let vivo=true;
    (async()=>{
      try {
        const guardado=await SecureStore.getItemAsync(TOKEN_KEY);
        if (guardado) {
          const d=await pedirAPI<{usuario:Usuario}>('/api/auth/me',{},guardado);
          if(vivo){setRolSesion(d.usuario.rol);setToken(guardado);setUsuario(d.usuario);}
        }
      } catch { if(vivo) setRolSesion(null); await SecureStore.deleteItemAsync(TOKEN_KEY).catch(()=>{}); }
      finally { if(vivo)setCargando(false); }
    })();
    return()=>{vivo=false;};
  },[]);
  const login=async(matricula:string,contrasena:string)=>{
    const r=await pedirAPI<{token:string;usuario:Usuario}>('/api/auth/login',{
      method:'POST',body:JSON.stringify({matricula,contrasena})
    });
    await SecureStore.setItemAsync(TOKEN_KEY,r.token);
    setRolSesion(r.usuario.rol);setToken(r.token);setUsuario(r.usuario);
  };
  const logout=async()=>{
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setRolSesion(null);setToken(null);setUsuario(null);
  };
  return <Contexto.Provider value={{token,usuario,cargando,login,logout}}>{children}</Contexto.Provider>;
}
export function useSession() {
  const ctx=useContext(Contexto);
  if(!ctx)throw new Error('Agrega SessionProvider en src/app/_layout.tsx');
  return ctx;
}
