import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

type Seccion = 'inicio' | 'libros' | 'prestamos' | 'perfil';

type Props = {
  actual: Seccion;
};

const opciones = [
  { id: 'inicio', etiqueta: 'Inicio', icono: 'home-outline', ruta: '/menu' },
  { id: 'libros', etiqueta: 'Libros', icono: 'book-outline', ruta: '/libros' },
  { id: 'prestamos', etiqueta: 'Préstamos', icono: 'reader-outline', ruta: '/prestamos' },
  { id: 'perfil', etiqueta: 'Perfil', icono: 'person-circle-outline', ruta: '/perfil' },
] as const;

export default function BarraNavegacion({ actual }: Props) {
  return (
    <View style={styles.contenedor} accessibilityRole="tablist">
      {opciones.map((opcion) => {
        const activo = opcion.id === actual;
        return (
          <Pressable
            key={opcion.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            accessibilityLabel={opcion.etiqueta}
            onPress={() => {
              if (!activo) router.replace(opcion.ruta);
            }}
            style={[styles.pestana, activo && styles.pestanaActiva]}
          >
            <Ionicons
              name={opcion.icono}
              size={18}
              color={activo ? COLORS.black : COLORS.white}
            />
            <Text style={[styles.etiqueta, activo && styles.etiquetaActiva]} numberOfLines={1}>
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: COLORS.navy,
    minHeight: 57,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 6,
  },
  pestana: {
    flex: 1,
    borderRadius: 15,
    minHeight: 43,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  pestanaActiva: { backgroundColor: COLORS.gold },
  etiqueta: { fontSize: 10, fontWeight: '600', color: COLORS.white, marginTop: 2 },
  etiquetaActiva: { color: COLORS.black },
});
