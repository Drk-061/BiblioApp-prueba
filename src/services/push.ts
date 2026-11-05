import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import {pedirAPI} from './api';

const TOKEN_PUSH_KEY='biblioapp_push_dispositivo';

Notifications.setNotificationHandler({
  handleNotification: async()=>({
    shouldShowBanner:true,
    shouldShowList:true,
    shouldPlaySound:true,
    shouldSetBadge:false,
  }),
});

export async function activarNotificacionesPush(tokenSesion:string) {
  if(Platform.OS==='web') throw new Error('Las notificaciones push se prueban en Android o iOS.');
  if(!Device.isDevice) throw new Error('Utiliza un dispositivo compatible con notificaciones push.');
  if(Platform.OS==='android') {
    await Notifications.setNotificationChannelAsync('biblioapp',{
      name:'Avisos de BiblioApp',importance:Notifications.AndroidImportance.HIGH,
    });
  }
  let permiso=await Notifications.getPermissionsAsync();
  if(!permiso.granted) permiso=await Notifications.requestPermissionsAsync();
  if(!permiso.granted) throw new Error('Debes autorizar las notificaciones.');
  const projectId=Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if(!projectId || String(projectId).startsWith('REEMPLAZAR')) {
    throw new Error('Configura un projectId EAS real en app.json para activar las notificaciones push.');
  }
  const resultado=await Notifications.getExpoPushTokenAsync({projectId});
  await pedirAPI('/api/avisos/dispositivos',{
    method:'POST',body:JSON.stringify({expoToken:resultado.data})
  },tokenSesion);
  await SecureStore.setItemAsync(TOKEN_PUSH_KEY,resultado.data);
  return resultado.data;
}

export async function desvincularNotificacionesPush(tokenSesion:string){
  const pushToken=await SecureStore.getItemAsync(TOKEN_PUSH_KEY);
  if(!pushToken)return;
  await pedirAPI('/api/avisos/dispositivos',{
    method:'DELETE',body:JSON.stringify({expoToken:pushToken})
  },tokenSesion);
  await SecureStore.deleteItemAsync(TOKEN_PUSH_KEY);
}
