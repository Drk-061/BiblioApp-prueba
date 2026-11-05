import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoGestion from '../components/EncabezadoGestion';
import FotoUsuario from '../components/FotoUsuario';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI } from '../services/api';
type SolicitudRegistroEncargado={id:number;nombre:string;matricula:string;estado:string};

export default function SolicitudesEncargadosScreen() {
  const {usuario,token}=useSession();
  const rol=usuario?.rol??'cliente';
  const [solicitudesRegistro,setSolicitudesRegistro]=useState<SolicitudRegistroEncargado[]>([]);
  const [error,setError]=useState('');
  const cargar=useCallback(async()=>{
    if(rol!=='admin')return;
    try{const d=await pedirAPI<{solicitudes:SolicitudRegistroEncargado[]}>('/api/admin/solicitudes-encargado',{},token);
      setSolicitudesRegistro(d.solicitudes);setError('');
    }catch(e){setError((e as Error).message)}
  },[rol,token]);
  useFocusEffect(useCallback(()=>{void cargar()},[cargar]));
  const [busqueda, setBusqueda] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase('es-MX');
    return solicitudesRegistro.filter(s =>
      (mostrarHistorial || s.estado === 'PENDIENTE') &&
      (s.nombre.toLocaleLowerCase('es-MX').includes(q) || s.matricula.toLocaleLowerCase('es-MX').includes(q))
    );
  }, [busqueda, mostrarHistorial, solicitudesRegistro]);

  const responder = (solicitud:SolicitudRegistroEncargado,decision:'Aprobada'|'Rechazada') => {
    Alert.alert(decision==='Aprobada'?'Aceptar registro':'Rechazar registro',
      `¿Procesar solicitud de ${solicitud.nombre}?`,[
        {text:'Cancelar',style:'cancel'},
        {text:'Confirmar',onPress:async()=>{
          try{await pedirAPI(`/api/admin/solicitudes-encargado/${solicitud.id}`,{
            method:'PATCH',body:JSON.stringify({aprobar:decision==='Aprobada'})
          },token);await cargar();Alert.alert('Solicitud procesada','Los datos se actualizaron.');}
          catch(e){Alert.alert('Error',(e as Error).message)}
        }}
      ]);
  };

  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <EncabezadoGestion titulo="Solicitudes" />
      {rol !== 'admin' ? (
        <View style={styles.denegado}>
          <Text>Solo el administrador puede revisar solicitudes.</Text>
          <Pressable onPress={() => router.replace('/menu')} style={styles.botonBorde}><Text style={styles.textoBorde}>Volver</Text></Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.interior} keyboardShouldPersistTaps="handled">
          <View style={styles.buscador}>
            <TextInput value={busqueda} onChangeText={setBusqueda} style={styles.entrada} placeholder="Buscar por nombre o matrícula..." placeholderTextColor="#AAB3C4" />
            <Ionicons name="search-outline" size={23} color={COLORS.navy} />
          </View>
          <View style={styles.filaTitulo}>
            <Text style={styles.titulo}>Solicitudes de Registro</Text>
            <Pressable onPress={() => setMostrarHistorial(v => !v)}><Text style={styles.enlace}>{mostrarHistorial ? 'Ver pendientes' : 'Ver historial'}</Text></Pressable>
          </View>
          <View style={styles.panel}>
            {!!error&&<Text style={styles.vacio}>{error}</Text>}
            {visibles.length === 0 ? <Text style={styles.vacio}>No hay solicitudes para mostrar.</Text> : visibles.map(s => (
              <View style={styles.tarjeta} key={s.id}>
                <View style={styles.info}>
                  <View style={styles.nombreFila}>
                    <FotoUsuario />
                    <Text style={styles.nombre} numberOfLines={2}>{s.nombre}</Text>
                  </View>
                  <Text style={styles.dato}>Matrícula: {s.matricula}</Text>
                  <Text style={styles.dato}>Estado: {s.estado}</Text>
                </View>
                {s.estado === 'PENDIENTE' && (
                  <View style={styles.botones}>
                    <Pressable style={styles.aceptar} onPress={() => responder(s, 'Aprobada')}><Text style={styles.textoBlanco}>Aceptar</Text></Pressable>
                    <Pressable style={styles.rechazar} onPress={() => responder(s, 'Rechazada')}><Text style={styles.textoBlanco}>Rechazar</Text></Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>

        </ScrollView>
      )}
      <BarraNavegacion actual="inicio" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { flex: 1, backgroundColor: '#F4F5F8' },
  interior: { padding: 14, paddingTop: 22, paddingBottom: 35 },
  buscador: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#B0BEDC', borderRadius: 8, paddingHorizontal: 12, height: 44, flexDirection: 'row', alignItems: 'center' },
  entrada: { flex: 1, color: COLORS.black, fontSize: 12 },
  filaTitulo: { marginTop: 24, marginBottom: 13, flexDirection: 'row', justifyContent: 'space-between', gap: 9, alignItems: 'center' },
  titulo: { fontWeight: '800', color: COLORS.navy, fontSize: 14, flexShrink: 1 },
  enlace: { fontSize: 11, fontWeight: '800', color: COLORS.navy },
  panel: { minHeight: 420, backgroundColor: COLORS.white, borderRadius: 11, padding: 10 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#9EADD1', borderRadius: 8, padding: 10, marginBottom: 13, gap: 9 },
  info: { flex: 1 },
  nombreFila: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nombre: { fontWeight: '800', color: COLORS.navy, fontSize: 12, flexShrink: 1 },
  dato: { fontSize: 11, color: '#59667C', marginTop: 2 },
  botones: { width: 100, gap: 6 },
  aceptar: { backgroundColor: '#2D8F41', alignItems: 'center', borderRadius: 6, padding: 8 },
  rechazar: { backgroundColor: '#EB2533', alignItems: 'center', borderRadius: 6, padding: 8 },
  textoBlanco: { color: COLORS.white, fontWeight: '800', fontSize: 11 },
  vacio: { marginTop: 25, textAlign: 'center', color: '#667185' },
  enlaceBaja: { flexDirection: 'row', justifyContent: 'center', gap: 3, alignItems: 'center', padding: 15 },
  denegado: { flex: 1, backgroundColor: '#F4F5F8', justifyContent: 'center', alignItems: 'center', gap: 15, padding: 30 },
  botonBorde: { borderColor: COLORS.navy, borderWidth: 1.5, borderRadius: 7, padding: 9 },
  textoBorde: { fontWeight: '700', color: COLORS.navy },
});
