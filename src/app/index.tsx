import { useEffect, useRef, useState } from 'react';
import { useSession } from '../context/SessionContext';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

export default function LoginScreen() {
  const [matricula, setMatricula] = useState('');
  const [contrasena, setContrasena] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const { login, usuario, cargando } = useSession();
  const [esperando, setEsperando] = useState(false);

  // También permite recuperar el menú cuando el token ya estaba guardado.
  useEffect(() => {
    if (!cargando && usuario) router.replace('/menu');
  }, [cargando, usuario]);

  const iniciarSesion = async () => {
    if (!matricula.trim() || !contrasena) {
      Alert.alert('Campos obligatorios', 'Ingresa tu matrícula y contraseña.');
      return;
    }
    if (esperando) return;
    setEsperando(true);
    try {
      await login(matricula.trim(), contrasena);
      setContrasena('');
      // useEffect redirige al menú de Figma cuando la sesión cambia.
    } catch (e) {
      Alert.alert('No se pudo iniciar sesión', e instanceof Error ? e.message : 'Error desconocido.');
    } finally { setEsperando(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>BIBLIOTECA UNIVERSITARIA</Text>
            <Text style={styles.headerSubtitle}>
              Universidad Autónoma de Chiapas
            </Text>
          </View>

          <View style={styles.content}>
            <Image
              source={require('../../assets/images/logo-unach.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Emblema de la biblioteca"
            />

            <Text style={styles.title}>Iniciar sesión</Text>

            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Matrícula</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese matrícula"
                placeholderTextColor={COLORS.placeholder}
                selectionColor={COLORS.gold}
                value={matricula}
                onChangeText={setMatricula}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                accessibilityLabel="Matrícula"
                underlineColorAndroid="transparent"
              />

              <Text style={[styles.fieldLabel, styles.passwordLabel]}>
                Contraseña
              </Text>
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Ingrese Contraseña"
                placeholderTextColor={COLORS.placeholder}
                selectionColor={COLORS.gold}
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={iniciarSesion}
                accessibilityLabel="Contraseña"
                underlineColorAndroid="transparent"
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={iniciarSesion}
              style={({ pressed }) => [
                styles.loginButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.loginButtonText}>{esperando ? 'Verificando...' : 'Iniciar Sesión'}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/registro')}
              style={({ pressed }) => [
                styles.registerButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.registerHint}>
                ¿Aún no te has{'\n'}registrado?
              </Text>
              <Text style={styles.registerText}>Regístrate</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.navy,
  },
  headerBar: {
    height: 26,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 10,
    lineHeight: 11,
    color: COLORS.black,
  },
  headerSubtitle: {
    fontSize: 8,
    lineHeight: 10,
    color: COLORS.black,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 56,
  },
  logo: {
    width: 115,
    height: 115,
    marginTop: 23,
  },
  title: {
    marginTop: 22,
    color: COLORS.white,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: 'bold',
  },
  formCard: {
    marginTop: 36,
    width: '90%',
    maxWidth: 400,
    minHeight: 244,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    paddingHorizontal: 17,
    paddingTop: 27,
    paddingBottom: 31,
  },
  fieldLabel: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    fontSize: 18,
    lineHeight: 23,
    color: COLORS.black,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold,
  },
  passwordLabel: {
    marginTop: 20,
  },
  input: {
    width: '100%',
    height: 45,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: 6,
    paddingHorizontal: 16,
    fontSize: 17,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  loginButton: {
    marginTop: 58,
    width: 161,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: '#777777',
    borderRadius: 6,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  registerButton: {
    marginTop: 40,
    width: '50%',
    maxWidth: 350,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gold,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  registerHint: {
    alignSelf: 'stretch',
    flexShrink: 0,
    color: COLORS.black,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 15,
    textAlign: 'center',
  },
  registerText: {
    alignSelf: 'stretch',
    flexShrink: 0,
    marginTop: 2,
    color: COLORS.black,
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: 'bold',
    lineHeight: 15,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
