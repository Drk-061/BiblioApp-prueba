import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoLibros from '../components/EncabezadoLibros';
import LibroCard from '../components/LibroCard';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI, type LibroAPI } from '../services/api';
import { convertirLibro } from '../services/vistasReales';
import { CATEGORIAS, type CategoriaLibro, type Libro } from '../types/libros';

type CategoriaFiltro = 'Todos' | CategoriaLibro;
const FILTROS: CategoriaFiltro[] = ['Todos', ...CATEGORIAS];

function normalizar(texto: string) {
  return texto.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function LibrosScreen() {
  const { width } = useWindowDimensions();
  const { usuario } = useSession();
  const rol = usuario?.rol ?? 'cliente';
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState(q ?? '');
  useFocusEffect(useCallback(() => {
    let activo = true;
    setBusqueda(q ?? '');
    setCargando(true);
    pedirAPI<{ libros: LibroAPI[] }>('/api/libros')
      .then(d => { if (activo) { setLibros(d.libros.map(convertirLibro)); setError(''); } })
      .catch(e => { if (activo) setError((e as Error).message); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [q]));
  const [categoria, setCategoria] = useState<CategoriaFiltro>('Todos');

  const lista = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return libros.filter((libro) => {
      const coincideCategoria = categoria === 'Todos' || libro.categoria === categoria;
      const coincideBusqueda = !termino || normalizar([
        libro.titulo, libro.autor, libro.editorial, libro.isbn, ...libro.palabrasClave,
      ].join(' ')).includes(termino);
      return coincideCategoria && coincideBusqueda;
    });
  }, [libros, busqueda, categoria]);

  const anchoPortada = Math.max(110, Math.min(154, (width - 90) / 2));

  return (
    <SafeAreaView style={styles.pagina} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <EncabezadoLibros titulo="Libros" />

      <View style={styles.cuerpo}>
        <View style={styles.buscador}>
          <TextInput
            style={styles.campo}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por título, autor o editorial..."
            placeholderTextColor={COLORS.placeholder}
            autoCorrect={false}
            returnKeyType="search"
          />
          <Ionicons name="search-outline" size={27} color="#597A9A" />
        </View>

        <View style={styles.filtrosArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
            {FILTROS.map((filtro) => (
              <Pressable
                key={filtro}
                onPress={() => setCategoria(filtro)}
                style={[styles.chip, categoria === filtro && styles.chipActivo]}
                accessibilityRole="button"
                accessibilityState={{ selected: categoria === filtro }}
              >
                <Text style={styles.textoChip}>{filtro}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView contentContainerStyle={styles.catalogoScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.catalogoPanel}>
            {cargando ? <ActivityIndicator size="large" color={COLORS.navy} /> : error ? (
              <Text style={styles.sinResultadosTexto}>No se pudieron cargar los libros: {error}</Text>
            ) : lista.length === 0 ? (
              <View style={styles.sinResultados}>
                <Ionicons name="book-outline" size={35} color={COLORS.navy} />
                <Text style={styles.sinResultadosTexto}>No se encontraron libros.</Text>
              </View>
            ) : (
              <View style={styles.cuadricula}>
                {lista.map((libro) => (
                  <LibroCard
                    key={libro.id}
                    libro={libro}
                    ancho={anchoPortada}
                    onPress={() => router.push({ pathname: '/detalle-libro', params: { id: libro.id } })}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {rol !== 'cliente' && (
          <Pressable
            style={styles.flotante}
            onPress={() => router.push('/registrar-libro')}
            accessibilityLabel="Registrar nuevo libro"
          >
            <Ionicons name="add" size={41} color={COLORS.gold} />
          </Pressable>
        )}
      </View>
      <BarraNavegacion actual="libros" />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  cuerpo: { flex: 1, backgroundColor: '#F5F6F8' },
  buscador: {
    marginTop: 24, marginHorizontal: 28, height: 45, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderColor: '#D9DDE4', borderWidth: 1,
    borderRadius: 8, paddingHorizontal: 12,
  },
  campo: { flex: 1, fontSize: 12, color: COLORS.black, paddingRight: 7 },
  filtrosArea: { marginTop: 25, marginBottom: 21 },
  filtros: { paddingHorizontal: 8, gap: 5, alignItems: 'center' },
  chip: {
    borderWidth: 1, borderColor: '#454545', backgroundColor: COLORS.white,
    borderRadius: 11, paddingHorizontal: 8, height: 30, justifyContent: 'center',
  },
  chipActivo: { backgroundColor: COLORS.gold },
  textoChip: { fontSize: 12, fontWeight: '700', color: COLORS.black },
  catalogoScroll: { paddingHorizontal: 17, paddingBottom: 25, flexGrow: 1 },
  catalogoPanel: {
    minHeight: 430, backgroundColor: COLORS.white, borderRadius: 14,
    paddingVertical: 29, paddingHorizontal: 11,
    borderWidth: 1, borderColor: '#E3E3E3',
    shadowColor: '#000', shadowOpacity: 0.11, shadowRadius: 5, elevation: 3,
  },
  cuadricula: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 34, columnGap: 5 },
  sinResultados: { flex: 1, minHeight: 320, justifyContent: 'center', alignItems: 'center', gap: 10 },
  sinResultadosTexto: { color: '#5B6370' },
  flotante: {
    position: 'absolute', right: 17, bottom: 11,
    width: 55, height: 55, borderRadius: 28, backgroundColor: COLORS.navy,
    alignItems: 'center', justifyContent: 'center', elevation: 7,
  },
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 25 },
  tarjetaDetalle: { width: '100%', maxWidth: 400, backgroundColor: COLORS.white, borderRadius: 14, padding: 22, gap: 9 },
  tituloDetalle: { color: COLORS.navy, fontWeight: '800', fontSize: 18, marginBottom: 8 },
  lineaDetalle: { color: '#303642', fontSize: 13 },
  cerrarDetalle: { marginTop: 12, alignSelf: 'flex-end', backgroundColor: COLORS.navy, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 9 },
  cerrarTexto: { color: COLORS.white, fontWeight: '700' },
});
