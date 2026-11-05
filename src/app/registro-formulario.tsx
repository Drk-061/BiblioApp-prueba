import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import {
  consultarDisponibilidadEncargado,
  solicitarRegistro,
  type TipoRegistro,
} from '../services/registroApi';

type Campos = {
  matricula: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correo: string;
  contrasena: string;
  repetirContrasena: string;
};

const inicial: Campos = {
  matricula: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '',
  correo: '', contrasena: '', repetirContrasena: '',
};

type CampoTexto = Exclude<keyof Campos, 'contrasena' | 'repetirContrasena'>;
const camposTexto: { clave: CampoTexto; etiqueta: string; placeholder: string }[] = [
  { clave: 'matricula', etiqueta: 'Matrícula', placeholder: 'Ingrese matrícula' },
  { clave: 'nombres', etiqueta: 'Nombres', placeholder: 'Ingrese Nombres' },
  { clave: 'apellidoPaterno', etiqueta: 'Apellido Paterno', placeholder: 'Ingrese Apellido Paterno' },
  { clave: 'apellidoMaterno', etiqueta: 'Apellido Materno', placeholder: 'Ingrese Apellido Materno' },
  { clave: 'correo', etiqueta: 'Correo', placeholder: 'Ingrese Correo' },
];

export default function RegistroFormulario() {
  const { tipo: parametro } = useLocalSearchParams<{ tipo?: string }>();
  const tipo: TipoRegistro = parametro === 'encargado' ? 'encargado' : 'cliente';
  const [campos, setCampos] = useState<Campos>(inicial);
  const [autorizado, setAutorizado] = useState(tipo === 'cliente');
  const [cargandoPermiso, setCargandoPermiso] = useState(tipo === 'encargado');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (clave: keyof Campos, valor: string) => {
    setCampos((anterior) => ({ ...anterior, [clave]: valor }));
  };

  // Segunda comprobación para no confiar en que se abrió desde registro.tsx.
  // El servidor deberá comprobarlo también al procesar el POST de registro.
  useEffect(() => {
    let vigente = true;
    if (tipo === 'cliente') {
      setAutorizado(true);
      setCargandoPermiso(false);
      return () => { vigente = false; };
    }

    setAutorizado(false);
    setCargandoPermiso(true);
    consultarDisponibilidadEncargado()
      .then((permitido) => {
        if (!vigente) return;
        if (!permitido) {
          router.replace('/registro-encargado-no-disponible');
        } else {
          setAutorizado(true);
        }
      })
      .catch(() => {
        if (vigente) {
          Alert.alert('Error de conexión', 'No se pudo verificar el permiso del encargado.');
          router.replace('/registro');
        }
      })
      .finally(() => { if (vigente) setCargandoPermiso(false); });

    return () => { vigente = false; };
  }, [tipo]);

  const registrar = async () => {
    if (enviando || cargandoPermiso || !autorizado) return;

    const matricula = campos.matricula.trim().toUpperCase();
    const nombres = campos.nombres.trim();
    const apellidoPaterno = campos.apellidoPaterno.trim();
    const apellidoMaterno = campos.apellidoMaterno.trim();
    const correo = campos.correo.trim().toLowerCase();

    if (!matricula || !nombres || !apellidoPaterno || !apellidoMaterno ||
        !correo || !campos.contrasena || !campos.repetirContrasena) {
      Alert.alert('Campos incompletos', 'Completa todos los campos del formulario.');
      return;
    }
    if (!/^[A-Z0-9-]{5,25}$/.test(matricula)) {
      Alert.alert('Matrícula inválida', 'Usa de 5 a 25 letras, números o guiones.');
      return;
    }
    if (correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      Alert.alert('Correo inválido', 'Introduce un correo electrónico válido.');
      return;
    }
    if (campos.contrasena.length < 8) {
      Alert.alert('Contraseña corta', 'La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (campos.contrasena !== campos.repetirContrasena) {
      Alert.alert('Las contraseñas no coinciden', 'Comprueba la contraseña de confirmación.');
      return;
    }

    setEnviando(true);
    try {
      if (tipo === 'encargado') {
        const permitido = await consultarDisponibilidadEncargado();
        if (!permitido) {
          router.replace('/registro-encargado-no-disponible');
          return;
        }
      }

      const resultado = await solicitarRegistro({
        matricula,
        nombres,
        apellidoPaterno,
        apellidoMaterno,
        correo,
        contrasena: campos.contrasena,
        tipoUsuario: tipo === 'cliente' ? 'CLIENTE' : 'ENCARGADO',
      });

      // Limpiar las contraseñas del estado antes de regresar a login.
      setCampos(inicial);
      const mensaje = resultado.estado === 'PENDIENTE_APROBACION'
        ? 'Solicitud recibida. El administrador debe aprobar la cuenta de encargado antes de iniciar sesión.'
        : 'Cuenta registrada correctamente. Ya puedes iniciar sesión.';
      Alert.alert('Registro completado',mensaje,[
        {text:'Volver a iniciar sesión',onPress:()=>router.replace('/')}
      ]);
    } catch (error) {
      Alert.alert(
        'No se pudo registrar',
        error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.franja}>
        <Text style={styles.nombreBiblioteca}>BIBLIOTECA UNIVERSITARIA</Text>
        <Text style={styles.nombreUniversidad}>Universidad Autónoma de Chiapas</Text>
      </View>

      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo-unach.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.titulo}>Registro</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.relleno}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {cargandoPermiso ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={styles.textoCargando}>Verificando autorización…</Text>
          </View>
        ) : autorizado ? (
          <ScrollView
            style={styles.relleno}
            contentContainerStyle={styles.contenido}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.tarjeta}>
              {camposTexto.map((campo) => (
                <View key={campo.clave} style={styles.grupoCampo}>
                  <Text style={styles.etiqueta}>{campo.etiqueta}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={campo.placeholder}
                    placeholderTextColor={COLORS.placeholder}
                    value={campos[campo.clave]}
                    onChangeText={(valor) => cambiar(campo.clave, valor)}
                    autoCapitalize={campo.clave === 'correo' ? 'none' : campo.clave === 'matricula' ? 'characters' : 'words'}
                    keyboardType={campo.clave === 'correo' ? 'email-address' : 'default'}
                    textContentType={campo.clave === 'correo' ? 'emailAddress' : undefined}
                    autoCorrect={false}
                    maxLength={campo.clave === 'correo' ? 254 : campo.clave === 'matricula' ? 25 : 100}
                    accessibilityLabel={campo.etiqueta}
                  />
                </View>
              ))}
              <View style={styles.grupoCampo}>
                <Text style={styles.etiqueta}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese Contraseña"
                  placeholderTextColor={COLORS.placeholder}
                  value={campos.contrasena}
                  onChangeText={(valor) => cambiar('contrasena', valor)}
                  secureTextEntry
                  textContentType="newPassword"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Contraseña"
                />
              </View>
              <View style={styles.grupoCampo}>
                <Text style={styles.etiqueta}>Repita la contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repita Contraseña"
                  placeholderTextColor={COLORS.placeholder}
                  value={campos.repetirContrasena}
                  onChangeText={(valor) => cambiar('repetirContrasena', valor)}
                  secureTextEntry
                  textContentType="newPassword"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Repetir contraseña"
                />
              </View>
            </View>

            {tipo === 'encargado' && (
              <Text style={styles.avisoEncargado}>
                Las cuentas de encargado requieren aprobación administrativa.
              </Text>
            )}

            <View style={styles.botones}>
              <Pressable
                onPress={() => router.replace('/registro')}
                style={({ pressed }) => [styles.botonAtras, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={16} color={COLORS.black} />
                <Text style={styles.textoAtras}>Atrás</Text>
              </Pressable>
              <Pressable
                onPress={registrar}
                disabled={enviando}
                style={({ pressed }) => [styles.botonRegistrar, (enviando || pressed) && { opacity: 0.7 }]}
                accessibilityRole="button"
              >
                {enviando ? (
                  <ActivityIndicator color={COLORS.navy} />
                ) : (
                  <Text style={styles.textoRegistrar}>Registrarse</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  relleno: { flex: 1 },
  franja: { minHeight: 27, backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' },
  nombreBiblioteca: { color: COLORS.black, fontSize: 10, fontWeight: '600' },
  nombreUniversidad: { color: COLORS.black, fontSize: 8 },
  header: { height: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 15 },
  logo: { height: 49, width: 49 },
  titulo: { fontSize: 25, fontWeight: '800', color: COLORS.white },
  contenido: { paddingHorizontal: 19, paddingBottom: 44, paddingTop: 10, alignItems: 'center' },
  tarjeta: { backgroundColor: COLORS.white, borderRadius: 12, padding: 15, width: '100%', maxWidth: 435, gap: 10 },
  grupoCampo: { gap: 4 },
  etiqueta: { color: COLORS.black, fontSize: 14, fontWeight: '800' },
  input: { borderColor: COLORS.inputBorder, borderWidth: 1, borderRadius: 6, height: 44, paddingHorizontal: 11, color: COLORS.black, fontSize: 14, backgroundColor: COLORS.white },
  avisoEncargado: { color: COLORS.white, fontSize: 12, textAlign: 'center', marginTop: 12 },
  botones: { width: '100%', maxWidth: 435, flexDirection: 'row', gap: 15, marginTop: 23 },
  botonAtras: { flex: 1, backgroundColor: COLORS.gold, borderRadius: 7, minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  textoAtras: { fontSize: 15, fontWeight: '700', color: COLORS.black },
  botonRegistrar: { flex: 1.2, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#A9ACB1', borderRadius: 7, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  textoRegistrar: { fontSize: 15, fontWeight: '800', color: COLORS.black },
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  textoCargando: { fontSize: 14, color: COLORS.white },
});
