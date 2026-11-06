import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { pedirAPI } from './api';

const TOKEN_PUSH_KEY = 'biblioapp_push_dispositivo';
let notificacionesConfiguradas = false;

export function estaEnExpoGo(): boolean {
  return Platform.OS !== 'web' && (
    Constants.expoGoConfig != null ||
    Constants.appOwnership === 'expo' ||
    Constants.expoVersion != null
  );
}

async function cargarNotificaciones() {
  if (estaEnExpoGo()) {
    throw new Error(
      'Expo Go no admite el registro de notificaciones push remotas. ' +
      'Instala una development build o APK propia para activar push.'
    );
  }
  const Notifications = await import('expo-notifications');
  if (!notificacionesConfiguradas) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificacionesConfiguradas = true;
  }
  return Notifications;
}

export async function activarNotificacionesPush(tokenSesion: string) {
  if (Platform.OS === 'web') {
    throw new Error('Las notificaciones push se prueban en Android o iOS.');
  }
  if (estaEnExpoGo()) {
    throw new Error(
      'Los avisos internos ya funcionan. Para recibir notificaciones ' +
      'fuera de la app debes instalar una APK propia de BiblioApp, ' +
      'no abrir el proyecto con Expo Go.'
    );
  }
  if (!Device.isDevice) {
    throw new Error('Utiliza un dispositivo compatible con notificaciones push.');
  }

  let Notifications: typeof import('expo-notifications');
  try {
    Notifications = await cargarNotificaciones();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('biblioapp', {
        name: 'Avisos de BiblioApp',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  } catch (error) {
    console.warn('[BiblioApp] Inicialización nativa de push:', error);
    throw new Error(
      'No se pudo inicializar el módulo nativo de notificaciones. ' +
      'la APK/development build tras instalar expo-notifications. '
    );
  }

  let permiso = await Notifications.getPermissionsAsync();
  if (!permiso.granted) permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) {
    throw new Error('Debes autorizar las notificaciones en los ajustes del teléfono.');
  }

  const projectId =
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId || String(projectId).startsWith('REEMPLAZAR')) {
    throw new Error('Configura un projectId EAS válido para activar las notificaciones push.');
  }

  const resultado = await Notifications.getExpoPushTokenAsync({ projectId });
  await pedirAPI('/api/avisos/dispositivos', {
    method: 'POST',
    body: JSON.stringify({ expoToken: resultado.data }),
  }, tokenSesion);
  await SecureStore.setItemAsync(TOKEN_PUSH_KEY, resultado.data);
  return resultado.data;
}

export async function desvincularNotificacionesPush(tokenSesion: string) {
  const pushToken = await SecureStore.getItemAsync(TOKEN_PUSH_KEY);
  if (!pushToken) return;
  await pedirAPI('/api/avisos/dispositivos', {
    method: 'DELETE',
    body: JSON.stringify({ expoToken: pushToken }),
  }, tokenSesion);
  await SecureStore.deleteItemAsync(TOKEN_PUSH_KEY);
}
