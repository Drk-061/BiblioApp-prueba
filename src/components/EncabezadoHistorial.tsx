import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

type Props = { titulo: string };

export default function EncabezadoHistorial({ titulo }: Props) {
  return (
    <View>
      <View style={styles.barra}>
        <Pressable
          style={styles.regresar}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Regresar"
        >
          <Ionicons name="arrow-back" size={25} color={COLORS.white} />
        </Pressable>
        <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
        <Image
          source={require('../../assets/recursos/darse-cuenta.png')}
          style={styles.campana}
          resizeMode="contain"
          accessibilityLabel="Notificaciones"
        />
      </View>
      <View style={styles.franja}>
        <Text style={styles.biblioteca}>BIBLIOTECA UNIVERSITARIA</Text>
        <Text style={styles.universidad}>Universidad Autónoma de Chiapas</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    height: 55, backgroundColor: COLORS.navy,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 15,
  },
  regresar: { width: 35, height: 44, justifyContent: 'center' },
  titulo: { color: COLORS.white, fontSize: 17, fontWeight: '700', textAlign: 'center', flex: 1 },
  campana: { width: 31, height: 31, marginLeft: 5 },
  franja: { height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.gold },
  biblioteca: { color: COLORS.black, fontSize: 10, fontWeight: '700' },
  universidad: { color: COLORS.black, fontSize: 8 },
});
