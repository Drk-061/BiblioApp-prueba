import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI } from '../services/api';
import type { AvisoReal } from '../services/biblioExtra';

const LIMITE_PREVIA = 8;
const INTERVALO_ACTUALIZACION_MS = 45000;

function fechaAviso(raw: string): Date | null {
  const fecha = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function diaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function horaAviso(raw: string): string {
  const fecha = fechaAviso(raw);
  return fecha ? fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
}

function iconoAviso(tipo: string): ComponentProps<typeof Ionicons>['name'] {
  switch (tipo.toUpperCase()) {
    case 'PRESTAMO': return 'book-outline';
    case 'DEVOLUCION': return 'checkmark-circle-outline';
    case 'VENCIMIENTO': return 'time-outline';
    case 'VENCIDO': return 'alert-circle-outline';
    case 'MULTA': return 'warning-outline';
    case 'MULTA_PAGADA': return 'checkmark-done-outline';
    case 'EXTRAVIO': return 'alert-outline';
    case 'RENOVACION': return 'refresh-outline';
    default: return 'notifications-outline';
  }
}

export default function CampanaNotificaciones() {
  const { token, usuario } = useSession();
  const [avisos, setAvisos] = useState<AvisoReal[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [anclaje, setAnclaje] = useState({ top: 80, left: 12 });
  const anclaRef = useRef<View>(null);
  const solicitudActual = useRef(0);

  const recargar = useCallback(async () => {
    const solicitud = ++solicitudActual.current;
    if (!token) {
      setAvisos([]);
      setError('');
      return;
    }
    setCargando(true);
    try {
      const datos = await pedirAPI<{ avisos: AvisoReal[] }>('/api/avisos', {}, token);
      if (solicitud === solicitudActual.current) {
        setAvisos(Array.isArray(datos.avisos) ? datos.avisos : []);
        setError('');
      }
    } catch (e) {
      if (solicitud === solicitudActual.current) {
        setError((e as Error).message || 'No fue posible consultar los avisos.');
      }
    } finally {
      if (solicitud === solicitudActual.current) setCargando(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void recargar();
    const intervalo = setInterval(() => void recargar(), INTERVALO_ACTUALIZACION_MS);
    return () => {
      clearInterval(intervalo);
      solicitudActual.current += 1;
    };
  }, [recargar, usuario?.matricula]));

  const noLeidas = useMemo(() => avisos.filter((a) => !a.leida).length, [avisos]);
  const recientes = avisos.slice(0, LIMITE_PREVIA);
  const ahora = new Date();
  const ayer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1);
  const claveHoy = diaLocal(ahora);
  const claveAyer = diaLocal(ayer);
  const grupos = [
    { titulo: 'Hoy', items: recientes.filter((a) => { const f = fechaAviso(a.fecha); return f && diaLocal(f) === claveHoy; }) },
    { titulo: 'Ayer', items: recientes.filter((a) => { const f = fechaAviso(a.fecha); return f && diaLocal(f) === claveAyer; }) },
    { titulo: 'Anteriores', items: recientes.filter((a) => { const f = fechaAviso(a.fecha); return !f || (diaLocal(f) !== claveHoy && diaLocal(f) !== claveAyer); }) },
  ];

  const abrir = () => {
    if (!token) return;
    const anchoVentana = Dimensions.get('window').width;
    const anchoPanel = Math.min(320, anchoVentana - 24);
    anclaRef.current?.measureInWindow((x, y, w, h) => {
      const left = Math.min(Math.max(12, x + w - anchoPanel + 8), anchoVentana - anchoPanel - 12);
      setAnclaje({ top: Math.max(64, y + h + 3), left });
      setVisible(true);
      void recargar();
    });
  };

  const marcarLeido = async (aviso: AvisoReal) => {
    if (aviso.leida || !token) return;
    setAvisos((actuales) => actuales.map((a) => a.id === aviso.id ? { ...a, leida: true } : a));
    try {
      await pedirAPI(`/api/avisos/${encodeURIComponent(aviso.id)}/leer`, { method: 'PATCH' }, token);
    } catch (e) {
      setAvisos((actuales) => actuales.map((a) => a.id === aviso.id ? { ...a, leida: false } : a));
      Alert.alert('Avisos', (e as Error).message);
    }
  };

  const verTodos = () => {
    setVisible(false);
    router.push('/avisos');
  };
  const tamanoPantalla = Dimensions.get('window');
  const anchoPanel = Math.min(320, tamanoPantalla.width - 24);
  const altoPanel = Math.max(190, Math.min(485, tamanoPantalla.height - anclaje.top - 20));

  return (
    <>
      <View ref={anclaRef} collapsable={false} style={styles.ancla}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ', ninguna sin leer'}`}
          accessibilityHint="Abre las notificaciones de tu cuenta"
          onPress={abrir}
          style={styles.botonCampana}
        >
          <Ionicons name="notifications" size={27} color={COLORS.gold} />
          {noLeidas > 0 && (
            <View style={styles.insignia}>
              <Text style={styles.numero}>{noLeidas > 99 ? '99+' : String(noLeidas)}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.capa}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Cerrar notificaciones"
            onPress={() => setVisible(false)}
          />
          <View style={[styles.panel, { top: anclaje.top, left: anclaje.left, width: anchoPanel, maxHeight: altoPanel }]}>
            <View style={styles.panelCabecera}>
              <Text style={styles.panelTitulo}>Notificaciones</Text>
              <Pressable accessibilityLabel="Cerrar panel" onPress={() => setVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={19} color={COLORS.navy} />
              </Pressable>
            </View>

            <ScrollView style={styles.lista} contentContainerStyle={styles.listaContenido} nestedScrollEnabled>
              {cargando && avisos.length === 0 && <ActivityIndicator color={COLORS.navy} style={{ marginVertical: 18 }} />}
              {!!error && <Text style={styles.error}>{error}</Text>}
              {!cargando && !error && avisos.length === 0 && (
                <Text style={styles.vacio}>Todavía no tienes notificaciones.</Text>
              )}
              {grupos.filter((g) => g.items.length > 0).map((grupo) => (
                <View key={grupo.titulo} style={styles.grupo}>
                  <Text style={styles.grupoTitulo}>{grupo.titulo}</Text>
                  {grupo.items.map((a) => (
                    <Pressable
                      key={a.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${a.titulo}. ${a.mensaje}. ${a.leida ? 'Leída' : 'No leída'}`}
                      onPress={() => void marcarLeido(a)}
                      style={[styles.tarjeta, !a.leida && styles.tarjetaNueva]}
                    >
                      <View style={styles.filaTitulo}>
                        <Ionicons name={iconoAviso(a.tipo)} size={14} color={COLORS.navy} />
                        <Text style={styles.tarjetaTitulo} numberOfLines={2}>{a.titulo}</Text>
                        {!a.leida && <View style={styles.puntoNuevo} />}
                      </View>
                      <Text style={styles.mensaje} numberOfLines={3}>{a.mensaje}</Text>
                      <View style={styles.filaPie}>
                        <Text style={styles.hora}>{horaAviso(a.fecha)}</Text>
                        {!a.leida && <Text style={styles.nuevo}>Nuevo</Text>}
                      </View>
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>

            <Pressable style={styles.verTodos} onPress={verTodos} accessibilityRole="button">
              <Text style={styles.verTodosTexto}>Ver todos los avisos</Text>
              <Ionicons name="chevron-forward" size={15} color={COLORS.navy} />
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  ancla: { width: 47, height: 50, alignItems: 'center', justifyContent: 'center' },
  botonCampana: { width: 46, height: 48, alignItems: 'center', justifyContent: 'center' },
  insignia: {
    position: 'absolute', right: 1, top: 2, minWidth: 17, height: 17,
    borderRadius: 9, paddingHorizontal: 2, backgroundColor: '#ED3F36',
    alignItems: 'center', justifyContent: 'center', borderColor: COLORS.navy, borderWidth: 1,
  },
  numero: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  capa: { flex: 1 },
  panel: {
    position: 'absolute', backgroundColor: '#FFF', borderRadius: 15,
    borderWidth: 1, borderColor: '#DFE3EB', paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.23, shadowRadius: 12, elevation: 14,
    overflow: 'hidden',
  },
  panelCabecera: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingBottom: 10,
  },
  panelTitulo: { color: COLORS.navy, fontSize: 16, fontWeight: '800' },
  lista: { flexGrow: 0, flexShrink: 1 },
  listaContenido: { paddingHorizontal: 13, paddingBottom: 6 },
  grupo: { marginBottom: 11, gap: 7 },
  grupoTitulo: { color: COLORS.navy, fontSize: 11, fontWeight: '800', marginLeft: 5 },
  tarjeta: {
    borderColor: '#C7D0E1', borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingTop: 9, paddingBottom: 8,
    backgroundColor: '#FFF',
  },
  tarjetaNueva: { borderColor: COLORS.navy, backgroundColor: '#F0F4FD' },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  tarjetaTitulo: { flexShrink: 1, color: COLORS.navy, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  puntoNuevo: { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.navy },
  mensaje: { fontSize: 10, color: '#222C42', textAlign: 'center', marginTop: 6, lineHeight: 14 },
  filaPie: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 7 },
  hora: { fontSize: 9, color: '#5B657A' },
  nuevo: { fontSize: 9, color: COLORS.navy, fontWeight: '800' },
  verTodos: {
    borderTopWidth: 1, borderTopColor: '#E6EAF1', paddingVertical: 12,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5,
  },
  verTodosTexto: { color: COLORS.navy, fontWeight: '800', fontSize: 12 },
  error: { color: '#A52B2B', fontSize: 11, textAlign: 'center', marginVertical: 10 },
  vacio: { color: '#636D7C', fontSize: 11, textAlign: 'center', marginVertical: 12 },
});
