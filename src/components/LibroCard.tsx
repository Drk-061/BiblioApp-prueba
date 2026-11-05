import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import type { Libro } from '../types/libros';

type Props = { libro: Libro; onPress: () => void; ancho: number };

export default function LibroCard({ libro, onPress, ancho }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.portada, { width: ancho }, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalles de ${libro.titulo}`}
    >
      <Text style={styles.marca}>[Portada]</Text>
      <Text style={styles.nombre} numberOfLines={3}>{libro.titulo}</Text>
      <Text style={styles.autor} numberOfLines={2}>{libro.autor}</Text>
      <Text style={styles.stock}>Disponibles: {libro.ejemplaresDisponibles}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  portada: {
    height: 144, borderRadius: 9, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: '#555', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, paddingVertical: 12, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3,
  },
  marca: { fontSize: 11, fontWeight: '700', color: COLORS.black },
  nombre: { fontSize: 11, fontWeight: '800', color: COLORS.black, textAlign: 'center', marginTop: 9 },
  autor: { fontSize: 10, fontWeight: '600', color: '#333', textAlign: 'center', marginTop: 3 },
  stock: { fontSize: 10, fontWeight: '800', color: COLORS.navy, textAlign: 'center', marginTop: 5 },
});
