import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarraNavegacion from './BarraNavegacion';
import { COLORS } from '../constants/colors';

export function PantallaPrestamo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable accessibilityLabel="Regresar" onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={COLORS.white} size={25} />
        </Pressable>
        <Text style={styles.tituloHeader} numberOfLines={1}>{titulo}</Text>
        <Image source={require('../../assets/images/logo-unach.png')}
          resizeMode="contain" style={styles.logo} />
      </View>
      <View style={styles.franja}>
        <Text style={styles.institucion}>BIBLIOTECA UNIVERSITARIA</Text>
        <Text style={styles.universidad}>Universidad Autónoma de Chiapas</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContenido}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <BarraNavegacion actual="prestamos" />
    </SafeAreaView>
  );
}
export function Seccion({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return <View style={styles.seccion}>
    {titulo ? <Text style={styles.tituloSeccion}>{titulo}</Text> : null}
    {children}
  </View>;
}
export function Recuadro({ titulo, valor, children }: {
  titulo?: string;
  valor?: string;
  children?: ReactNode;
}) {
  return <View style={styles.recuadro}>
    {titulo ? <Text style={styles.tituloDato}>{titulo}</Text> : null}
    {valor ? <Text style={styles.valor}>{valor}</Text> : null}
    {children}
  </View>;
}
export function BotonPrestamo({ titulo, onPress, variante = 'blanco', disabled = false }: {
  titulo: string;
  onPress: () => void;
  variante?: 'blanco' | 'amarillo' | 'azul';
  disabled?: boolean;
}) {
  return <Pressable onPress={onPress} disabled={disabled}
    style={[styles.boton, variante === 'amarillo' && styles.botonAmarillo,
      variante === 'azul' && styles.botonAzul, disabled && styles.botonDeshabilitado]}>
    <Text style={[styles.textoBoton, variante === 'azul' && styles.textoBlanco]}>{titulo}</Text>
  </Pressable>;
}
export function Acciones({ children }: { children: ReactNode }) {
  return <View style={styles.acciones}>{children}</View>;
}
export function SinPrestamo() {
  return <Seccion>
    <Text style={styles.aviso}>El préstamo no existe o no está disponible para este usuario.</Text>
    <BotonPrestamo titulo="Volver a préstamos" onPress={() => router.replace('/prestamos')} />
  </Seccion>;
}
const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  header: {
    height: 55, backgroundColor: COLORS.navy, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, gap: 8,
  },
  tituloHeader: { color: COLORS.white, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  logo: { width: 35, height: 35 },
  franja: { backgroundColor: COLORS.gold, alignItems: 'center', paddingVertical: 3 },
  institucion: { fontSize: 10, color: COLORS.black, fontWeight: '700' },
  universidad: { fontSize: 8, color: COLORS.black },
  scroll: { flex: 1, backgroundColor: '#F4F5F7' },
  scrollContenido: { paddingHorizontal: 14, paddingVertical: 16, flexGrow: 1, paddingBottom: 24 },
  seccion: { backgroundColor: COLORS.white, borderRadius: 12, padding: 13, marginBottom: 12,
    borderWidth: 1, borderColor: '#E0E3EA' },
  tituloSeccion: { color: COLORS.navy, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  recuadro: { borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: 7,
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 10, alignItems: 'center', gap: 4 },
  tituloDato: { color: '#3A4253', textAlign: 'center', fontSize: 11, fontWeight: '700' },
  valor: { color: COLORS.black, textAlign: 'center', fontSize: 12, lineHeight: 17 },
  boton: { borderRadius: 7, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1.5, borderColor: COLORS.navy, backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center', minWidth: 105 },
  botonAmarillo: { backgroundColor: COLORS.gold },
  botonAzul: { backgroundColor: COLORS.navy },
  botonDeshabilitado: { opacity: 0.45 },
  textoBoton: { color: COLORS.navy, fontWeight: '700', fontSize: 12, textAlign: 'center' },
  textoBlanco: { color: COLORS.white },
  acciones: { flexDirection: 'row', gap: 10, justifyContent: 'space-around', marginTop: 6 },
  aviso: { textAlign: 'center', color: COLORS.navy, marginVertical: 20, fontSize: 13 },
});
