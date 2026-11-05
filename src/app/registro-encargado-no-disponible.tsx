import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

export default function RegistroEncargadoNoDisponible() {
  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.franja}>
        <Text style={styles.nombreBiblioteca}>BIBLIOTECA UNIVERSITARIA</Text>
        <Text style={styles.nombreUniversidad}>Universidad Autónoma de Chiapas</Text>
      </View>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Image
          source={require('../../assets/images/logo-unach.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logotipo Biblioteca UNACH"
        />
        <View style={styles.mensaje}>
          <Text style={styles.textoMensaje}>
            Lo sentimos... Esta opción no está disponible por el momento.
            Comunícate con tu responsable o con la administración de la biblioteca.
          </Text>
        </View>
        <Pressable
          onPress={() => router.replace('/registro')}
          style={({ pressed }) => [styles.boton, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
        >
          <Text style={styles.textoBoton}>Atrás</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  franja: { minHeight: 28, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  nombreBiblioteca: { color: COLORS.black, fontSize: 10, fontWeight: '600' },
  nombreUniversidad: { color: COLORS.black, fontSize: 8 },
  contenido: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 57, paddingBottom: 50 },
  logo: { width: 145, height: 145 },
  mensaje: { backgroundColor: COLORS.white, width: '94%', maxWidth: 340, borderRadius: 6, padding: 16, marginTop: 45 },
  textoMensaje: { color: COLORS.black, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  boton: { marginTop: 64, backgroundColor: COLORS.gold, paddingHorizontal: 40, minHeight: 43, justifyContent: 'center', borderRadius: 7 },
  textoBoton: { color: COLORS.black, fontWeight: '800', fontSize: 16 },
});
