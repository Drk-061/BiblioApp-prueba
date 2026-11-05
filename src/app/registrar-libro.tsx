import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoLibros from '../components/EncabezadoLibros';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI } from '../services/api';
import { CATEGORIAS, type CategoriaLibro } from '../types/libros';

type Formulario = {
  isbn: string; titulo: string; autor: string; editorial: string; edicion: string;
  anio: string; idioma: string; paginas: string; categoria: CategoriaLibro | '';
  palabrasClave: string;
};

const INICIAL: Formulario = {
  isbn: '', titulo: '', autor: '', editorial: '', edicion: '', anio: '',
  idioma: 'Español', paginas: '', categoria: '', palabrasClave: '',
};

type CampoProps = {
  titulo: string;
  valor: string;
  cambiar: (texto: string) => void;
  teclado?: 'default' | 'number-pad';
  placeholder?: string;
};

function Campo({ titulo, valor, cambiar, teclado = 'default', placeholder }: CampoProps) {
  return (
    <View style={styles.grupoCampo}>
      <Text style={styles.etiqueta}>{titulo}</Text>
      <TextInput
        style={styles.entrada}
        value={valor}
        onChangeText={cambiar}
        keyboardType={teclado}
        placeholder={placeholder ?? titulo}
        placeholderTextColor="#AEB4BE"
        autoCapitalize="sentences"
      />
    </View>
  );
}

export default function RegistrarLibroScreen() {
  const { usuario, token } = useSession();
  const rol = usuario?.rol ?? 'cliente';
  const [formulario, setFormulario] = useState<Formulario>(INICIAL);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (clave: keyof Formulario, valor: string) => {
    setFormulario((previo) => ({ ...previo, [clave]: valor }));
  };

  const guardar = async () => {
    if (guardando) return;
    if (rol === 'cliente') {
      Alert.alert('Acceso restringido', 'Solo el personal encargado puede registrar libros.');
      return;
    }

    const f = formulario;
    const faltantes = [f.isbn, f.titulo, f.autor, f.editorial, f.anio, f.paginas, f.categoria];
    if (faltantes.some((valor) => !valor.trim())) {
      Alert.alert('Campos incompletos', 'Llena ISBN, título, autor, editorial, año, páginas y categoría.');
      return;
    }

    const isbn = f.isbn.replace(/[\s-]/g, '').toUpperCase();
    if (!/^(?:\d{13}|\d{9}[\dX])$/.test(isbn)) {
      Alert.alert('ISBN inválido', 'Ingresa un ISBN de 10 o 13 caracteres válidos (puedes usar guiones).');
      return;
    }
    const anio = Number(f.anio);
    const paginas = Number(f.paginas);
    if (!Number.isInteger(anio) || anio < 1450 || anio > new Date().getFullYear() + 1) {
      Alert.alert('Año inválido', 'Revisa el año de publicación.');
      return;
    }
    if (!Number.isInteger(paginas) || paginas < 1) {
      Alert.alert('Páginas inválidas', 'El número de páginas debe ser mayor que cero.');
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await pedirAPI<{libro:{id:string}}>(
        '/api/libros', {
          method: 'POST',
          body: JSON.stringify({
            isbn, titulo: f.titulo.trim(), autor: f.autor.trim(),
            editorial: f.editorial.trim(), edicion: f.edicion.trim(),
            anioPublicacion: anio, numeroPaginas: paginas,
            idioma: f.idioma.trim() || 'Español',
            categoria: ({'Matemáticas':'MATEMATICAS','Ciencias':'CIENCIAS',
              'Programación':'PROGRAMACION','Literatura':'LITERATURA',
              'Historia':'OTROS','Otros':'OTROS'} as Record<string,string>)[f.categoria] ?? 'OTROS',
            palabrasClave: f.palabrasClave.split(',').map(x => x.trim()).filter(Boolean),
            cantidadEjemplares: 1,
          }),
        }, token);
      router.replace({ pathname: '/libro-registrado', params: { id: respuesta.libro.id } });
    } catch (e) {
      Alert.alert('No se pudo registrar', (e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <EncabezadoLibros titulo="Registrar libro" regresar />
      <KeyboardAvoidingView style={styles.cuerpo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {rol === 'cliente' ? (
            <View style={styles.formulario}>
              <Text style={styles.titulo}>Acceso restringido</Text>
              <Text>Solo los encargados pueden registrar libros.</Text>
              <Pressable style={styles.cancelar} onPress={() => router.replace('/libros')}>
                <Text style={styles.textoBoton}>Volver a Libros</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.formulario}>
              <Text style={styles.titulo}>• Datos del libro</Text>
              <Campo titulo="ISBN *" valor={formulario.isbn} cambiar={(v) => cambiar('isbn', v)} placeholder="978..." />
              <Campo titulo="Título *" valor={formulario.titulo} cambiar={(v) => cambiar('titulo', v)} />
              <Campo titulo="Autor *" valor={formulario.autor} cambiar={(v) => cambiar('autor', v)} />
              <Campo titulo="Editorial *" valor={formulario.editorial} cambiar={(v) => cambiar('editorial', v)} />
              <Campo titulo="Edición" valor={formulario.edicion} cambiar={(v) => cambiar('edicion', v)} />
              <Campo titulo="Año de publicación *" valor={formulario.anio} cambiar={(v) => cambiar('anio', v)} teclado="number-pad" placeholder="2026" />
              <Campo titulo="Idioma" valor={formulario.idioma} cambiar={(v) => cambiar('idioma', v)} />
              <Campo titulo="Número de páginas *" valor={formulario.paginas} cambiar={(v) => cambiar('paginas', v)} teclado="number-pad" />

              <Text style={styles.etiqueta}>Categoría *</Text>
              <Pressable style={styles.selector} onPress={() => setSelectorAbierto((valor) => !valor)}>
                <Text style={formulario.categoria ? styles.selectorValor : styles.selectorPlace}>
                  {formulario.categoria || 'Seleccionar categoría'}
                </Text>
                <Ionicons name={selectorAbierto ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.navy} />
              </Pressable>
              {selectorAbierto && (
                <View style={styles.opciones}>
                  {CATEGORIAS.map((cat) => (
                    <Pressable key={cat} style={styles.opcion} onPress={() => { cambiar('categoria', cat); setSelectorAbierto(false); }}>
                      <Text style={styles.selectorValor}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Campo
                titulo="Palabras clave"
                valor={formulario.palabrasClave}
                cambiar={(v) => cambiar('palabrasClave', v)}
                placeholder="Separadas por comas"
              />
              <Text style={styles.nota}>* Campos obligatorios. Al guardar se crea el libro y su primer ejemplar con QR; podrás agregar más copias desde Ejemplares.</Text>

              <View style={styles.acciones}>
                <Pressable style={styles.cancelar} onPress={() => router.replace('/libros')}>
                  <Text style={styles.textoBoton}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.continuar} onPress={guardar} disabled={guardando}>
                  <Text style={styles.textoBoton}>{guardando ? 'Registrando...' : 'Continuar'}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <BarraNavegacion actual="libros" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  cuerpo: { flex: 1, backgroundColor: '#F5F6F8' },
  scroll: { flexGrow: 1, paddingVertical: 24, paddingHorizontal: 25 },
  formulario: {
    backgroundColor: COLORS.white, borderRadius: 13, padding: 18,
    borderColor: '#E4E4E4', borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 2,
  },
  titulo: { color: COLORS.navy, fontSize: 17, fontWeight: '800', marginBottom: 15 },
  grupoCampo: { marginBottom: 11 },
  etiqueta: { color: COLORS.black, fontWeight: '700', fontSize: 12, marginBottom: 4 },
  entrada: {
    height: 41, backgroundColor: COLORS.white, borderColor: COLORS.inputBorder,
    borderWidth: 1, borderRadius: 7, paddingHorizontal: 10, fontSize: 13, color: COLORS.black,
  },
  selector: {
    height: 42, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 7, paddingHorizontal: 10, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  selectorValor: { color: COLORS.black, fontSize: 13 },
  selectorPlace: { color: '#8E98A6', fontSize: 13 },
  opciones: { borderColor: '#CFD4DF', borderWidth: 1, borderRadius: 8, marginBottom: 11 },
  opcion: { paddingHorizontal: 12, paddingVertical: 11, borderBottomColor: '#ECECEC', borderBottomWidth: 1 },
  nota: { fontSize: 11, color: '#636B78', marginTop: 4, lineHeight: 16 },
  acciones: { flexDirection: 'row', gap: 12, marginTop: 21 },
  cancelar: {
    flex: 1, minHeight: 39, backgroundColor: COLORS.white, borderWidth: 1,
    borderColor: '#666', borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },
  continuar: {
    flex: 1, minHeight: 39, backgroundColor: COLORS.gold, borderWidth: 1,
    borderColor: COLORS.navy, borderRadius: 9, justifyContent: 'center', alignItems: 'center',
  },
  textoBoton: { color: COLORS.black, fontSize: 12, fontWeight: '700' },
});
