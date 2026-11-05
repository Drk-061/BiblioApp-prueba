import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

export type Prestamo = {
  id: string;
  titulo: string;
  autor: string;
  categoria: string;
  codigoEjemplar: string;
  matricula: string;
  nombreUsuario?: string;
  fechaPrestamo: string;
  fechaLimite: string;
  estado: 'Activo' | 'Devuelto';
};

type Props = {
  prestamo: Prestamo;
  onDetalles: () => void;
  onDevolucion: () => void;
  mostrarUsuario?: boolean;
};

export default function PrestamoCard({ prestamo, onDetalles, onDevolucion, mostrarUsuario = false }: Props) {
  const devuelto = prestamo.estado === 'Devuelto';

  return (
    <View style={styles.card}>
      <View style={styles.informacion}>
        {mostrarUsuario && (
          <Text style={styles.nombreUsuario} numberOfLines={1}>{prestamo.nombreUsuario ?? prestamo.matricula}</Text>
        )}
        <Image source={require('../../assets/recursos/libro.png')} style={styles.iconoLibro} resizeMode="contain" />
        <Text style={styles.titulo} numberOfLines={2}>{prestamo.titulo}</Text>
        <Text style={styles.autor} numberOfLines={2}>{prestamo.autor}</Text>
        <Text style={styles.ejemplar}>
          Ejemplar: <Text style={styles.codigo}>{prestamo.codigoEjemplar}</Text>
        </Text>
        {mostrarUsuario && <Text style={styles.fechaLimite}>Límite: {prestamo.fechaLimite}</Text>}
      </View>

      <View style={styles.acciones}>
        <Pressable style={styles.botonSecundario} onPress={onDetalles}>
          <Text style={styles.textoSecundario}>Detalles</Text>
        </Pressable>
        <Pressable
          style={[styles.botonPrincipal, devuelto && styles.botonDeshabilitado]}
          onPress={onDevolucion}
          disabled={devuelto}
        >
          <Text style={styles.textoPrincipal}>{devuelto ? 'Devuelto' : 'Devolución'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderColor: COLORS.inputBorder, borderWidth: 1, borderRadius: 9,
    padding: 9, marginBottom: 15, minHeight: 92,
  },
  informacion: { flex: 1, paddingRight: 8, justifyContent: 'center' },
  iconoLibro: { width: 19, height: 19, alignSelf: 'center', marginBottom: 3 },
  nombreUsuario: { color: COLORS.navy, fontWeight: '700', fontSize: 11, textAlign: 'center', marginBottom: 3 },
  fechaLimite: { color: '#4A5873', fontSize: 10, textAlign: 'center', marginTop: 5 },
  titulo: { color: COLORS.navy, fontWeight: '700', fontSize: 12, textAlign: 'center' },
  autor: { color: COLORS.navy, fontWeight: '600', fontSize: 11, textAlign: 'center', marginTop: 2 },
  ejemplar: { color: COLORS.navy, fontSize: 11, textAlign: 'center', marginTop: 11 },
  codigo: { color: '#818694' },
  acciones: { width: 113, gap: 7 },
  botonSecundario: {
    minHeight: 31, backgroundColor: COLORS.white, borderWidth: 2,
    borderColor: COLORS.navy, borderRadius: 7, justifyContent: 'center', alignItems: 'center',
  },
  textoSecundario: { fontSize: 12, fontWeight: '700', color: COLORS.navy },
  botonPrincipal: {
    minHeight: 31, backgroundColor: COLORS.navy, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
  },
  botonDeshabilitado: { opacity: 0.55 },
  textoPrincipal: { fontSize: 12, color: COLORS.white, fontWeight: '600' },
});
