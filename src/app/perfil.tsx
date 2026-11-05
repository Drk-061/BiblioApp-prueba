import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import QRCode from 'react-native-qrcode-svg';
import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoBiblioteca from '../components/EncabezadoBiblioteca';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI, type PrestamoAPI } from '../services/api';

type Pestaña = 'datos' | 'qr';

type FilaDatoProps = { texto: string };

function FilaDato({ texto }: FilaDatoProps) {
  return (
    <View style={styles.filaDato}>
      <Text style={styles.textoDato} numberOfLines={2}>{texto}</Text>
    </View>
  );
}

type AccionProps = {
  titulo: string;
  icono: keyof typeof Ionicons.glyphMap;
  alPresionar: () => void;
};

function Accion({ titulo, icono, alPresionar }: AccionProps) {
  return (
    <Pressable onPress={alPresionar} style={styles.accion} accessibilityRole="button">
      <Ionicons name={icono} size={21} color={COLORS.black} />
      <Text style={styles.textoAccion}>{titulo}</Text>
    </Pressable>
  );
}

export default function PerfilScreen() {
  // /perfil abre Datos; /perfil?tab=qr abre directamente la credencial.
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [pestana, setPestana] = useState<Pestaña>(tab === 'qr' ? 'qr' : 'datos');

  // Sincroniza al abrir la pantalla o regresar a ella desde otra ruta.
  // El menú envía /perfil?tab=qr para entrar directamente a la credencial.
  useFocusEffect(
    useCallback(() => {
      setPestana(tab === 'qr' ? 'qr' : 'datos');
    }, [tab])
  );
  const { usuario, token, logout } = useSession();
  const [conteos, setConteos] = useState<{prestados:number;devueltos:number} | null>(null);
  // Los totales de préstamos se consultan desde Node.js; no utilizar
  // Las cantidades se consultan desde la API.
  useFocusEffect(useCallback(() => {
    if (!token || !usuario) return;
    let activo = true;
    pedirAPI<{prestamos:PrestamoAPI[]}>('/api/prestamos', {}, token).then(d => {
      if (!activo) return;
      const propios = d.prestamos.filter(p => p.matricula === usuario.matricula);
      setConteos({
        prestados: propios.flatMap(p => p.ejemplares).filter(e => e.estado === 'PRESTADO' || e.estado === 'EXTRAVIADO').length,
        devueltos: propios.flatMap(p => p.ejemplares).filter(e => e.estado === 'DEVUELTO').length,
      });
    }).catch(() => { if (activo) setConteos(null); });
    return () => { activo = false; };
  }, [token, usuario?.matricula]));
  const [codigoQrReal,setCodigoQrReal]=useState('');
  const [qrExpira,setQrExpira]=useState('');
  const [qrError,setQrError]=useState('');
  const generarQr=useCallback(async()=>{
    if(!token)return;
    try {const respuesta=await pedirAPI<{qr:string;fechaExpiracion:string}>('/api/credenciales/generar',{method:'POST'},token);
      setCodigoQrReal(respuesta.qr);setQrExpira(respuesta.fechaExpiracion);setQrError('');
    }catch(e){setQrError((e as Error).message)}
  },[token]);
  useFocusEffect(useCallback(()=>{if(pestana==='qr'&&!codigoQrReal)void generarQr()},[pestana,codigoQrReal,generarQr]));
  const { width } = useWindowDimensions();
  const dimensionQR = Math.round(Math.min(210, Math.max(145, width - 124)));

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Quieres regresar a la pantalla de inicio de sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/');
            } catch {
              Alert.alert('Error', 'No se pudo cerrar la sesión correctamente.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <EncabezadoBiblioteca titulo="Perfil" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.saludo}>Hola, {usuario?.nombres.split(' ')[0] ?? 'Usuario'}</Text>

        <View style={styles.avatar} accessibilityLabel="Foto de perfil no configurada">
          <Ionicons name="person-outline" size={90} color="#58429A" />
        </View>

        <View style={styles.selector} accessibilityRole="tablist">
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: pestana === 'datos' }}
            style={[styles.opcion, pestana === 'datos' && styles.opcionActiva]}
            onPress={() => setPestana('datos')}
          >
            <Text style={[styles.textoSelector, pestana === 'datos' && styles.textoSelectorActivo]}>
              Datos
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: pestana === 'qr' }}
            style={[styles.opcion, pestana === 'qr' && styles.opcionActiva]}
            onPress={() => setPestana('qr')}
          >
            <Text style={[styles.textoSelector, pestana === 'qr' && styles.textoSelectorActivo]}>
              QR
            </Text>
          </Pressable>
        </View>

        {pestana === 'datos' ? (
          <View style={styles.tarjetaDatos}>
            <FilaDato texto={`Matrícula: ${usuario?.matricula ?? '—'}`} />
            <FilaDato texto={usuario?.nombre ?? '—'} />
            <FilaDato texto={`Correo: ${usuario?.correo ?? '—'}`} />
            <FilaDato texto={`Estado: ${usuario?.estado === 'ACTIVA' ? 'Activo' : usuario?.estado ?? '—'}`} />

            <View style={styles.contadores}>
              <View style={styles.contador}>
                <Text style={styles.tituloContador}>Libros Prestados</Text>
                <Text style={styles.numeroContador}>{conteos ? conteos.prestados : '—'}</Text>
              </View>
              <View style={styles.contador}>
                <Text style={styles.tituloContador}>Libros Devueltos</Text>
                <Text style={styles.numeroContador}>{conteos ? conteos.devueltos : '—'}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.seccionQR}>
            <View style={styles.tarjetaQR}>
              {codigoQrReal ? <QRCode value={codigoQrReal} size={dimensionQR} color="#000000" backgroundColor="#FFFFFF" /> : <Text>{qrError||'Generando credencial...'}</Text>}
              <Text style={styles.leyendaDemo}>Credencial temporal · Expira: {qrExpira ? new Date(qrExpira).toLocaleTimeString('es-MX') : '—'}</Text>
              <Pressable onPress={()=>void generarQr()} style={{padding:9,backgroundColor:COLORS.gold,borderRadius:9,marginTop:12}}><Text style={{color:COLORS.navy,fontWeight:'700'}}>Generar nuevo QR</Text></Pressable>
            </View>
            <View style={styles.panelAcciones}>
              <Accion
                titulo="Acerca de"
                icono="information-circle-outline"
                alPresionar={() => Alert.alert('Acerca de BiblioApp', 'Aplicación de la Biblioteca Universitaria. Esta sección está en desarrollo.')}
              />
              <Accion
                titulo="Aviso de Privacidad"
                icono="shield-checkmark-outline"
                alPresionar={() => Alert.alert('Aviso de Privacidad', 'Aquí se mostrará el aviso de privacidad oficial de la institución cuando esté disponible.')}
              />
              <Accion
                titulo="Reglas"
                icono="document-text-outline"
                alPresionar={() => Alert.alert('Reglas', 'Aquí se publicará el reglamento oficial de los servicios bibliotecarios.')}
              />
              <Accion
                titulo="Cerrar sesión"
                icono="log-out-outline"
                alPresionar={cerrarSesion}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <BarraNavegacion actual="perfil" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { flex: 1, backgroundColor: '#F5F6F8' },
  contenido: {
    alignItems: 'center',
    flexGrow: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
  saludo: { fontSize: 17, fontWeight: '400', color: '#171717', marginBottom: 7 },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#E9DEFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 9,
    marginBottom: 15,
  },
  opcion: {
    minWidth: 54,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  opcionActiva: { backgroundColor: '#1378FF' },
  textoSelector: { color: '#7B7B7B', fontSize: 12 },
  textoSelectorActivo: { color: COLORS.white, fontWeight: '700' },
  tarjetaDatos: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderColor: '#E4E4E4',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  filaDato: {
    minHeight: 43,
    marginBottom: 18,
    borderRadius: 9,
    borderColor: '#737373',
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 13,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  textoDato: { color: COLORS.black, fontSize: 13, fontWeight: '700' },
  contadores: { flexDirection: 'row', gap: 15, marginTop: 8, marginBottom: 4 },
  contador: {
    flex: 1,
    minHeight: 94,
    borderWidth: 1,
    borderColor: '#737373',
    borderRadius: 9,
    padding: 10,
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
  },
  tituloContador: { fontSize: 13, color: COLORS.black, fontWeight: '700' },
  numeroContador: { fontSize: 13, color: COLORS.black, fontWeight: '700', textAlign: 'center' },
  seccionQR: { width: '100%', alignItems: 'center' },
  tarjetaQR: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    alignItems: 'center',
    paddingHorizontal: 19,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  leyendaDemo: { fontSize: 10, color: '#6B7280', paddingTop: 8 },
  panelAcciones: {
    width: '100%',
    marginTop: 9,
    backgroundColor: COLORS.white,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E7E7E7',
    padding: 13,
    gap: 9,
  },
  accion: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: 7,
    borderWidth: 1,
    borderColor: '#747474',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.white,
  },
  textoAccion: { fontSize: 14, color: COLORS.black, fontWeight: '700' },
});
