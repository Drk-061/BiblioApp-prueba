import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

type Props = { titulo: string };

export default function EncabezadoGestion({ titulo }: Props) {
  return (
    <>
      <View style={styles.barra}>
        <Pressable
          style={styles.lateral}
          onPress={() => router.back()}
          accessibilityLabel="Regresar"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.titulo} numberOfLines={1}>{titulo}</Text>
        <Pressable
          style={styles.lateral}
          onPress={() => router.push('/avisos')}
          accessibilityLabel="Abrir avisos"
        >
          <Image
            source={require('../../assets/recursos/biblioapp-campana-demo.png')}
            resizeMode="contain"
            style={styles.campana}
          />
        </Pressable>
      </View>
      <View style={styles.franja}>
        <Text style={styles.franjaTitulo}>BIBLIOTECA UNIVERSITARIA</Text>
        <Text style={styles.franjaSub}>Universidad Autónoma de Chiapas</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  barra: {
    minHeight: 52, backgroundColor: COLORS.navy,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  lateral: { width: 40, height: 42, alignItems: 'center', justifyContent: 'center' },
  titulo: { flex: 1, color: COLORS.white, fontWeight: '800', fontSize: 17, textAlign: 'center' },
  campana: { width: 25, height: 28 },
  franja: {
    backgroundColor: COLORS.gold, minHeight: 26,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 2,
  },
  franjaTitulo: { color: COLORS.black, fontSize: 10, fontWeight: '700' },
  franjaSub: { color: COLORS.black, fontSize: 8 },
});
