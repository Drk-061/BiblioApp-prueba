import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { consultarDisponibilidadEncargado } from '../services/registroApi';

export default function RegistroScreen() {
  const [comprobando, setComprobando] = useState(false);

  const elegirCliente = () => {
    if (comprobando) return;
    router.push({
      pathname: '/registro-formulario',
      params: { tipo: 'cliente' },
    });
  };

  const elegirEncargado = async () => {
    if (comprobando) return;
    setComprobando(true);
    try {
      const habilitado = await consultarDisponibilidadEncargado();
      if (habilitado) {
        router.push({
          pathname: '/registro-formulario',
          params: { tipo: 'encargado' },
        });
      } else {
        router.push('/registro-encargado-no-disponible');
      }
    } catch (error) {
      Alert.alert(
        'No se pudo comprobar el permiso',
        error instanceof Error ? error.message : 'Comprueba tu conexión con el servidor.'
      );
    } finally {
      setComprobando(false);
    }
  };

  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.franja}>
        <Text style={styles.nombreBiblioteca}>BIBLIOTECA UNIVERSITARIA</Text>
        <Text style={styles.nombreUniversidad}>Universidad Autónoma de Chiapas</Text>
      </View>

      <Pressable
        style={styles.volver}
        onPress={() => router.replace('/')}
        accessibilityRole="button"
        accessibilityLabel="Volver a iniciar sesión"
      >
        <Ionicons name="arrow-back" color={COLORS.white} size={24} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../../assets/images/logo-unach.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logotipo Biblioteca UNACH"
        />
        <Text style={styles.titulo}>Registro</Text>
        <View style={styles.pregunta}>
          <Text style={styles.preguntaTexto}>¿Qué tipo de usuario eres?</Text>
        </View>

        <Pressable
          onPress={elegirCliente}
          disabled={comprobando}
          style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
          accessibilityRole="button"
        >
          <Text style={styles.textoBoton}>Cliente</Text>
        </Pressable>

        <Pressable
          onPress={elegirEncargado}
          disabled={comprobando}
          style={({ pressed }) => [styles.boton, styles.botonEncargado, pressed && styles.presionado]}
          accessibilityRole="button"
        >
          {comprobando ? (
            <ActivityIndicator color={COLORS.black} />
          ) : (
            <Text style={styles.textoBoton}>Encargado</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  franja: { backgroundColor: COLORS.gold, minHeight: 28, alignItems: 'center', justifyContent: 'center' },
  nombreBiblioteca: { color: COLORS.black, fontSize: 10, fontWeight: '600' },
  nombreUniversidad: { color: COLORS.black, fontSize: 8 },
  volver: { position: 'absolute', top: 57, left: 15, zIndex: 1, padding: 5 },
  contenido: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 60,
  },
  logo: { width: 132, height: 132 },
  titulo: { color: COLORS.white, fontSize: 27, fontWeight: '800', marginTop: 8 },
  pregunta: { alignSelf: 'flex-start', backgroundColor: COLORS.white, borderRadius: 5, paddingHorizontal: 11, paddingVertical: 9, marginTop: 34 },
  preguntaTexto: { color: COLORS.black, fontSize: 15, fontWeight: '700' },
  boton: {
    marginTop: 65,
    width: '74%', maxWidth: 270, minHeight: 53,
    backgroundColor: COLORS.gold, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  botonEncargado: { marginTop: 55 },
  textoBoton: { color: COLORS.black, fontSize: 17, fontWeight: '800' },
  presionado: { opacity: 0.72 },
});
