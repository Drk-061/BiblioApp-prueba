import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';

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
        <Pressable
          style={styles.campana}
          accessibilityLabel="Notificaciones"
          onPress={() => Alert.alert('Avisos', 'El módulo de avisos estará disponible próximamente.')}
        >
          <Ionicons name="notifications" size={27} color={COLORS.gold} />
          <View style={styles.contador}><Text style={styles.contadorTexto}>1</Text></View>
        </Pressable>
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
  campana: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
  contador: { position: 'absolute', top: 4, right: 2, backgroundColor: '#F04438', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  contadorTexto: { color: COLORS.black, fontSize: 10, fontWeight: '800' },
  franja: { backgroundColor: COLORS.gold, height: 29, alignItems: 'center', justifyContent: 'center' },
  institucion: { color: COLORS.black, fontSize: 10, fontWeight: '600' },
  universidad: { color: COLORS.black, fontSize: 8 },
});
