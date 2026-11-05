import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator, Image, Keyboard, Pressable, ScrollView, StyleSheet,
  Text, TextInput, View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarraNavegacion from '../components/BarraNavegacion';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI, type PrestamoAPI } from '../services/api';
import type { RolUsuario } from '../types/libros';

type Accion =
  | 'prestamos' | 'avisos' | 'vencidos' | 'adeudos' | 'credencial'
  | 'historial' | 'consultas' | 'usuarios' | 'encargados' | 'multas';

type Elemento = {
  id: Accion;
  titulo: string;
  imagen: ImageSourcePropType;
  valor?: string;
};

const IMAGENES = {
  prestamos: require('../../assets/recursos/libro.png'),
  avisosResumen: require('../../assets/recursos/darse-cuenta.png'),
  vencidos: require('../../assets/recursos/reloj.png'),
  adeudos: require('../../assets/recursos/reloj.png'),
  credencial: require('../../assets/recursos/qr.png'),
  avisos: require('../../assets/recursos/activo.png'),
  consultas: require('../../assets/recursos/buscar.png'),
  historial: require('../../assets/recursos/historial.png'),
  usuarios: require('../../assets/recursos/gestion.png'), 
  encargados: require('../../assets/recursos/gestion.png'), 
  multas: require('../../assets/recursos/gestion.png'), 
} satisfies Record<string, ImageSourcePropType>;

const estadisticasComunes: Elemento[] = [
  { id: 'prestamos', titulo: 'Préstamos', imagen: IMAGENES.prestamos },
  { id: 'avisos', titulo: 'Avisos', imagen: IMAGENES.avisosResumen },
];

const credencial: Elemento = {
  id: 'credencial', titulo: 'Credencial', imagen: IMAGENES.credencial, valor: 'QR',
};

const menus: Record<RolUsuario, { estadisticas: Elemento[]; accesos: Elemento[] }> = {
  cliente: {
    estadisticas: [
      ...estadisticasComunes,
      { id: 'adeudos', titulo: 'Adeudos', imagen: IMAGENES.adeudos },
      credencial,
    ],
    accesos: [
      { id: 'avisos', titulo: 'Avisos', imagen: IMAGENES.avisos },
      { id: 'consultas', titulo: 'Consultas', imagen: IMAGENES.consultas },
      { id: 'historial', titulo: 'Historial', imagen: IMAGENES.historial },
      { id: 'multas', titulo: 'Multas', imagen: IMAGENES.multas },
    ],
  },
  encargado: {
    estadisticas: [
      ...estadisticasComunes,
      { id: 'vencidos', titulo: 'Vencidos', imagen: IMAGENES.vencidos },
      credencial,
    ],
    accesos: [
      { id: 'avisos', titulo: 'Avisos', imagen: IMAGENES.avisos },
      { id: 'consultas', titulo: 'Consultas', imagen: IMAGENES.consultas },
      { id: 'historial', titulo: 'Historial', imagen: IMAGENES.historial },
      { id: 'usuarios', titulo: 'Usuarios', imagen: IMAGENES.usuarios },
    ],
  },
  admin: {
    estadisticas: [
      ...estadisticasComunes,
      { id: 'vencidos', titulo: 'Vencidos', imagen: IMAGENES.vencidos },
      credencial,
    ],
    accesos: [
      { id: 'historial', titulo: 'Historial', imagen: IMAGENES.historial },
      { id: 'consultas', titulo: 'Consultas', imagen: IMAGENES.consultas },
      { id: 'encargados', titulo: 'Encargados', imagen: IMAGENES.encargados },
      { id: 'usuarios', titulo: 'Usuarios', imagen: IMAGENES.usuarios },
    ],
  },
};

export default function MenuScreen() {
  const { usuario, token, cargando } = useSession();
  const rol: RolUsuario = usuario?.rol ?? 'cliente';
  const contenido = menus[rol];
  const [busqueda, setBusqueda] = useState('');
  const [resumen, setResumen] = useState<{prestamos: number; vencidos: number; avisos: number; adeudos: number} | null>(null);
  useFocusEffect(useCallback(() => {
    if (!token || !usuario) return;
    let activo = true;
    Promise.all([pedirAPI<{prestamos: PrestamoAPI[]}>('/api/prestamos', {}, token),
      pedirAPI<{avisos: {leida:boolean}[]}>('/api/avisos',{},token),
      pedirAPI<{multas: {estado:string;monto:string|number}[]}>('/api/multas',{},token)])
      .then(([datos,avisoData,multaData]) => {
        if (!activo) return;
        const actuales = datos.prestamos.filter(p => p.estado === 'ACTIVO');
        const hoy = new Date();
        hoy.setHours(0,0,0,0);
        const vencidos = actuales.filter(p => {
          const limite = new Date(p.fechaLimite);
          return !Number.isNaN(limite.getTime()) && limite.getTime() < hoy.getTime();
        });
        setResumen({ prestamos: actuales.length, vencidos: vencidos.length,
          avisos: avisoData.avisos.filter(a=>!a.leida).length,
          adeudos: multaData.multas.filter(m=>m.estado==='PENDIENTE').reduce((s,m)=>s+Number(m.monto),0) });
      })
      .catch(() => { if (activo) setResumen(null); });
    return () => { activo = false; };
  }, [token, usuario?.matricula]));

  useEffect(() => {
    if (!cargando && !usuario) router.replace('/');
  }, [cargando, usuario]);

  const buscarEnCatalogo = () => {
    const texto = busqueda.trim();
    Keyboard.dismiss();
    if (texto) {
      router.push({ pathname: '/libros', params: { q: texto } });
    } else {
      router.push('/libros');
    }
  };

  const abrirSeccion = (accion: Accion) => {
    switch (accion) {
      case 'prestamos':
        router.push('/prestamos');
        return;
      case 'vencidos':
        router.push({ pathname: '/prestamos', params: { filtro: 'Vencidos' } });
        return;
      case 'historial':
        router.push('/historial-prestamos');
        return;
      case 'credencial':
        router.push({ pathname: '/perfil', params: { tab: 'qr' } });
        return;
      case 'consultas':
        router.push('/libros');
        return;
      case 'avisos':
        router.push('/avisos');
        return;
      case 'adeudos':
        return;
      case 'multas':
        if (rol === 'cliente') router.push('/multas');
        return;
      case 'usuarios':
        if (rol !== 'cliente') router.push('/usuarios');
        return;
      case 'encargados':
        if (rol === 'admin') router.push('/encargados');
        return;
    }
  };

  if (cargando || !usuario) return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:COLORS.navy}}>
      <ActivityIndicator color={COLORS.gold} size="large" />
    </View>
  );

  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View style={styles.encabezado}>
        <Pressable
          accessibilityLabel="Ir a mi perfil"
          accessibilityRole="button"
          onPress={() => router.push('/perfil')}
        >
          <Image
            source={require('../../assets/images/logo-inicio.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>
        <Text style={styles.tituloEncabezado}>Inicio</Text>
        <View style={styles.campana} />
      </View>

      <View style={styles.franjaAmarilla}>
        <Text style={styles.biblioteca}>BIBLIOTECA UNIVERSITARIA</Text>
        <Text style={styles.universidad}>Universidad Autónoma de Chiapas</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenidoScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.saludo}>
          Hola, {usuario.nombres.split(' ')[0]}{'\n'}Bienvenido a Biblioteca UNACH
        </Text>

        <View style={styles.buscador}>
          <TextInput
            style={styles.campoBusqueda}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar en Biblioteca UNACH..."
            placeholderTextColor="#B5BAC4"
            onSubmitEditing={buscarEnCatalogo}
            returnKeyType="search"
            accessibilityLabel="Buscar libros"
          />
          <Pressable
            accessibilityLabel="Realizar búsqueda"
            onPress={buscarEnCatalogo}
            style={styles.buscarBoton}
          >
            <Ionicons name="search-outline" size={28} color="#597A9A" />
          </Pressable>
        </View>

        <View style={styles.panelEstadisticas}>
          {contenido.estadisticas.map((item) => {
            const valor = item.id === 'adeudos'
              ? (resumen ? `$${resumen.adeudos.toFixed(2)}` : '—')
              : item.id === 'prestamos'
                ? (resumen ? String(resumen.prestamos) : '—')
                : item.id === 'vencidos'
                  ? (resumen ? String(resumen.vencidos) : '—')
                  : item.id==='avisos' ? (resumen ? String(resumen.avisos) : '—') : item.valor;
            const indicador = (
              <>
                <Image
                  source={item.imagen}
                  style={styles.imagenEstadistica}
                  resizeMode="contain"
                />
                <Text style={styles.tituloEstadistica}>{item.titulo}</Text>
                <Text style={styles.valorEstadistica}>{valor}</Text>
              </>
            );
            if (item.id === 'prestamos' || item.id === 'avisos' || item.id === 'adeudos') {
              return (
                <View
                  key={item.id}
                  style={styles.estadistica}
                  accessible
                  accessibilityLabel={`${item.titulo}: ${valor}`}
                >
                  {indicador}
                </View>
              );
            }

            return (
              <Pressable
                key={item.id}
                onPress={() => abrirSeccion(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`${item.titulo}: ${valor}`}
                style={({ pressed }) => [styles.estadistica, pressed && styles.presionado]}
              >
                {indicador}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.panelMenu}>
          <Text style={styles.tituloSeccion}>• MENÚ PRINCIPAL</Text>
          <View style={styles.cuadricula}>
            {contenido.accesos.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => abrirSeccion(item.id)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.acceso, pressed && styles.presionado]}
              >
                <Image
                  source={item.imagen}
                  style={styles.imagenAcceso}
                  resizeMode="contain"
                />
                <Text style={styles.textoAcceso} numberOfLines={1}>
                  {item.titulo}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <BarraNavegacion actual="inicio" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  encabezado: {
    height: 56, backgroundColor: COLORS.navy,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  logo: { width: 49, height: 49 },
  tituloEncabezado: { color: COLORS.white, fontSize: 19, fontWeight: '700' },
  campana: { width: 45, height: 48, alignItems: 'center', justifyContent: 'center' },
  franjaAmarilla: {
    backgroundColor: COLORS.gold, height: 27,
    justifyContent: 'center', alignItems: 'center',
  },
  biblioteca: { fontSize: 10, color: COLORS.black, fontWeight: '600' },
  universidad: { fontSize: 8, color: COLORS.black },
  scroll: { flex: 1, backgroundColor: '#F5F6F8' },
  contenidoScroll: { paddingHorizontal: 19, paddingTop: 24, paddingBottom: 45, flexGrow: 1 },
  saludo: {
    textAlign: 'center', fontSize: 16, lineHeight: 20, color: '#151515',
    marginBottom: 12,
  },
  buscador: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    width: '95%', height: 47, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: '#DADEE6', borderRadius: 7,
    paddingLeft: 10, marginBottom: 28,
  },
  campoBusqueda: { flex: 1, fontSize: 13, color: COLORS.black },
  buscarBoton: { width: 44, height: '100%', alignItems: 'center', justifyContent: 'center' },
  panelEstadisticas: {
    backgroundColor: COLORS.white, borderRadius: 13,
    borderWidth: 1, borderColor: '#E6E8EA', padding: 13,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',
    rowGap: 15,
  },
  estadistica: {
    width: '46%', minHeight: 91, borderWidth: 1, borderColor: '#555',
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.white, paddingVertical: 7, paddingHorizontal: 3,
  },
  imagenEstadistica: { width: 30, height: 30, marginBottom: 3 },
  tituloEstadistica: { fontSize: 15, fontWeight: '700', color: '#101010', textAlign: 'center' },
  valorEstadistica: { fontSize: 15, fontWeight: '700', color: '#101010' },
  panelMenu: {
    backgroundColor: COLORS.white, borderRadius: 13,
    borderWidth: 1, borderColor: '#E6E8EA',
    padding: 13, marginTop: 31, marginBottom: 20,
  },
  tituloSeccion: { fontSize: 15, color: COLORS.navy, fontWeight: '800', marginBottom: 11 },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 13 },
  acceso: {
    width: '47%', minHeight: 40, borderWidth: 1,
    borderColor: '#666', borderRadius: 8,
    backgroundColor: COLORS.white,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  imagenAcceso: { width: 19, height: 19, marginRight: 5 },
  textoAcceso: { color: '#161616', fontSize: 13, fontWeight: '700' },
  enlaceMvp: {
    marginBottom: 18, alignSelf: 'center', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 15,
  },
  enlaceMvpTexto: { color: COLORS.navy, textDecorationLine: 'underline', fontWeight: '700', fontSize: 12 },
  presionado: { opacity: 0.65 },
});
