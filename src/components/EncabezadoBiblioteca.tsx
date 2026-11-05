import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

type Props = {
  titulo: string;
};

/** Encabezado institucional reutilizable: azul + franja amarilla. */
export default function EncabezadoBiblioteca({ titulo }: Props) {
  return (
    <View>
      <View style={styles.cabecera}>
        <Image
          source={require('../../assets/images/logo-unach.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Emblema de la Biblioteca Universitaria"
        />
        <Text style={styles.titulo}>{titulo}</Text>
      </View>
      <View style={styles.franja}>
        <Text style={styles.institucion}>BIBLIOTECA UNIVERSITARIA</Text>
        <Text style={styles.universidad}>Universidad Autónoma de Chiapas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    height: 57,
    backgroundColor: COLORS.navy,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  logo: { width: 47, height: 47 },
  titulo: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    marginRight: 47, // centra el texto compensando el logotipo
  },
  franja: {
    height: 29,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  institucion: { fontSize: 10, color: COLORS.black, fontWeight: '600' },
  universidad: { fontSize: 8, color: COLORS.black },
});
