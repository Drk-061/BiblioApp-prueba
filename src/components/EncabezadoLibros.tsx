import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import CampanaNotificaciones from './CampanaNotificaciones';

type Props = { titulo: string; regresar?: boolean };

export default function EncabezadoLibros({ titulo, regresar = false }: Props) {
  return (
    <View>
      <View style={styles.barra}>
        <Pressable
          style={styles.logoArea}
          onPress={() => regresar ? router.back() : router.push('/perfil')}
          accessibilityLabel={regresar ? 'Regresar' : 'Abrir perfil'}
        >
          {regresar ? (
            <Ionicons name="arrow-back" size={26} color={COLORS.white} />
          ) : (
            <Image
              source={require('../../assets/images/logo-unach.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          )}
        </Pressable>
        <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
        <CampanaNotificaciones />
      </View>
      <View style={styles.franja}>
        <Text style={styles.institucion}>BIBLIOTECA UNIVERSITARIA</Text>
        <Text style={styles.universidad}>Universidad Autónoma de Chiapas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: { height: 57, backgroundColor: COLORS.navy, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  logoArea: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 47, height: 47 },
  titulo: { flex: 1, fontSize: 20, color: COLORS.white, fontWeight: '700', textAlign: 'center' },
  franja: { backgroundColor: COLORS.gold, height: 29, alignItems: 'center', justifyContent: 'center' },
  institucion: { color: COLORS.black, fontSize: 10, fontWeight: '600' },
  universidad: { color: COLORS.black, fontSize: 8 },
});
