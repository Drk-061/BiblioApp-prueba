import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoGestion from '../components/EncabezadoGestion';
import FotoUsuario from '../components/FotoUsuario';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI } from '../services/api';

export default function EncargadosScreen() {
  const {usuario,token}=useSession();
  const rol=usuario?.rol??'cliente';
  type Encargado={matricula:string;nombre:string;estado:string};
  type Solicitud={id:number;matricula:string;nombre:string;estado:string};
  const [usuarios,setUsuarios]=useState<Encargado[]>([]);
  const [solicitudesRegistro,setSolicitudesRegistro]=useState<Solicitud[]>([]);
  const [registroEncargadosHabilitado,setRegistroEncargadosHabilitado]=useState(false);
  const [error,setError]=useState('');
  const cargar=useCallback(async()=>{
    if(rol!=='admin')return;
    try{
      const [datos,cfg,sol]=await Promise.all([
        pedirAPI<{encargados:Encargado[]}>('/api/admin/encargados',{},token),
        pedirAPI<{registroEncargadosHabilitado:boolean}>('/api/admin/configuracion',{},token),
        pedirAPI<{solicitudes:Solicitud[]}>('/api/admin/solicitudes-encargado',{},token),
      ]);
      setUsuarios(datos.encargados);setRegistroEncargadosHabilitado(cfg.registroEncargadosHabilitado);
      setSolicitudesRegistro(sol.solicitudes);setError('');
    }catch(e){setError((e as Error).message)}
  },[rol,token]);
  useFocusEffect(useCallback(()=>{void cargar()},[cargar]));
  const [busqueda, setBusqueda] = useState('');
  const [soloActivos, setSoloActivos] = useState(false);

  const encargados = useMemo(() => {
    const texto = busqueda.trim().toLocaleLowerCase('es-MX');
    return usuarios.filter(u =>
      (!soloActivos || u.estado === 'ACTIVA') &&
      (u.nombre.toLocaleLowerCase('es-MX').includes(texto) ||
       u.matricula.toLocaleLowerCase('es-MX').includes(texto))
    );
  }, [usuarios, busqueda, soloActivos]);

  const cambiarDisponibilidad = async (valor:boolean) => {
    try {
      await pedirAPI('/api/admin/configuracion/registro-encargados',{
        method:'PATCH',body:JSON.stringify({habilitado:valor})
      },token);
      setRegistroEncargadosHabilitado(valor);
    }catch(e){Alert.alert('No se pudo cambiar',(e as Error).message)}
  };

  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <EncabezadoGestion titulo="Encargados" />

      {rol !== 'admin' ? (
        <View style={styles.sinAcceso}>
          <Text style={styles.textoSinAcceso}>Solo el administrador puede gestionar a los encargados.</Text>
          <Pressable style={styles.botonContorno} onPress={() => router.replace('/menu')}>
            <Text style={styles.textoContorno}>Volver al inicio</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.interior} keyboardShouldPersistTaps="handled">
          <View style={styles.buscador}>
            <TextInput
              value={busqueda} onChangeText={setBusqueda}
              placeholder="Buscar por nombre o matrícula..."
              placeholderTextColor="#ACB4C1"
              style={styles.entrada}
              autoCorrect={false}
            />
            <Ionicons name="search-outline" size={23} color={COLORS.navy} />
          </View>

          <View style={styles.configuracion}>
            <Text style={styles.tituloEtiqueta}>Registro de encargados</Text>
            <View style={styles.conmutador}>
              <Text style={[styles.estadoRegistro, !registroEncargadosHabilitado && styles.desactivadoTexto]}>
                {registroEncargadosHabilitado ? 'Habilitado' : 'Deshabilitado'}
              </Text>
              <Switch
                accessibilityLabel="Habilitar o deshabilitar registro de encargados"
                value={registroEncargadosHabilitado}
                onValueChange={cambiarDisponibilidad}
                trackColor={{ false: '#ABB3BF', true: '#83A8F9' }}
                thumbColor={registroEncargadosHabilitado ? '#0C60E0' : '#E9E9E9'}
              />
            </View>
          </View>

          <View style={styles.encabezadoLista}>
            <Text style={styles.tituloEtiqueta}>Lista de Encargados</Text>
            <Pressable style={styles.botonContorno} onPress={() => router.push('/solicitudes-encargados')}>
              <Text style={styles.textoContorno}>
                Solicitudes ({solicitudesRegistro.filter(s => s.estado === 'PENDIENTE').length})
              </Text>
            </Pressable>
          </View>
          <Pressable style={styles.filtro} onPress={() => setSoloActivos(v => !v)}>
            <Ionicons name={soloActivos ? 'checkbox' : 'square-outline'} size={18} color={COLORS.navy} />
            <Text style={styles.textoFiltro}>Solo encargados activos</Text>
          </Pressable>

          <View style={styles.panel}>
            {!!error&&<Text style={styles.vacio}>{error}</Text>}
            {encargados.length === 0 ? (
              <Text style={styles.vacio}>No se encontraron encargados.</Text>
            ) : encargados.map(item => (
              <View style={styles.tarjeta} key={item.matricula}>
                <View style={styles.info}>
                  <View style={styles.filaNombre}>
                    <FotoUsuario />
                    <Text style={styles.nombre} numberOfLines={2}>{item.nombre}</Text>
                  </View>
                  <Text style={styles.dato}>Matrícula: {item.matricula}</Text>
                  <Text style={styles.dato}>Tipo: Encargado</Text>
                  <Text style={styles.dato}>
                    Estado: <Text style={item.estado === 'ACTIVA' ? styles.activo : styles.inactivo}>{item.estado}</Text>
                  </Text>
                </View>
                <Pressable
                  style={styles.botonContorno}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalles de ${item.nombre}`}
                  onPress={() => router.push({ pathname: '/detalle-encargado', params: { id: item.matricula } })}
                >
                  <Text style={styles.textoContorno}>Detalles</Text>
                </Pressable>
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
  interior: { padding: 15, paddingTop: 22, paddingBottom: 32 },
  buscador: { height: 44, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#9EADD2', borderRadius: 8, paddingHorizontal: 11 },
  entrada: { flex: 1, fontSize: 13, color: COLORS.black },
  configuracion: { marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  tituloEtiqueta: { color: COLORS.navy, fontSize: 13, fontWeight: '800', flexShrink: 1 },
  conmutador: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  estadoRegistro: { color: '#1862D0', fontWeight: '700', fontSize: 11 },
  desactivadoTexto: { color: '#667085' },
  encabezadoLista: { marginTop: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 },
  botonContorno: { paddingHorizontal: 11, paddingVertical: 7, borderColor: COLORS.navy, borderWidth: 1.5, borderRadius: 7, backgroundColor: COLORS.white, minWidth: 73, alignItems: 'center', justifyContent: 'center' },
  textoContorno: { color: COLORS.navy, fontWeight: '800', fontSize: 11, textAlign: 'center' },
  filtro: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 10 },
  textoFiltro: { color: COLORS.navy, fontSize: 12 },
  panel: { minHeight: 440, backgroundColor: COLORS.white, padding: 12, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tarjeta: { flexDirection: 'row', borderWidth: 1, borderRadius: 9, borderColor: '#9AABD1', padding: 11, gap: 7, minHeight: 87, alignItems: 'center', marginBottom: 14 },
  info: { flex: 1 },
  filaNombre: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  nombre: { flexShrink: 1, fontWeight: '800', fontSize: 12, color: COLORS.navy },
  dato: { fontSize: 11, color: '#566177', marginTop: 2 },
  activo: { color: '#24814A', fontWeight: '700' },
  inactivo: { color: '#CF3434', fontWeight: '700' },
  vacio: { color: '#64748B', textAlign: 'center', marginTop: 28 },
  sinAcceso: { flex: 1, backgroundColor: '#F4F5F8', alignItems: 'center', justifyContent: 'center', gap: 15, padding: 25 },
  textoSinAcceso: { textAlign: 'center', color: COLORS.navy },
  enlaceBajas: { marginTop: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, padding: 10 },
});
