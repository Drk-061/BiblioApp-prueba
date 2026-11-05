import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback,useMemo,useState } from 'react';
import { ActivityIndicator,Alert,Pressable,ScrollView,StyleSheet,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoBiblioteca from '../components/EncabezadoBiblioteca';
import PrestamoCard, { type Prestamo } from '../components/PrestamoCard';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI, type PrestamoAPI } from '../services/api';
import { filasPrestamos,fechaCorta,type FilaPrestamo } from '../services/vistasReales';
type Filtro = 'Todos' | 'Activos' | 'Devueltos' | 'Vencidos';
export default function PrestamosScreen(){
  const {usuario,token}=useSession();
  const rol=usuario?.rol??'cliente';
  const personal=rol!=='cliente';
  const {filtro:filtroRuta,usuarioBuscar}=useLocalSearchParams<{filtro?:string;usuarioBuscar?:string}>();
  const [registros,setRegistros]=useState<FilaPrestamo[]>([]);
  const [error,setError]=useState('');
  const [cargando,setCargando]=useState(true);
  const [busqueda,setBusqueda]=useState('');
  const [filtro,setFiltro]=useState<Filtro>('Todos');
  const [mostrarFiltros,setMostrarFiltros]=useState(false);
  useFocusEffect(useCallback(()=>{
    let activo=true;
    setFiltro(filtroRuta==='Activos'||filtroRuta==='Devueltos'||filtroRuta==='Vencidos'?filtroRuta:'Todos');
    setCargando(true);
    pedirAPI<{prestamos:PrestamoAPI[]}>('/api/prestamos',{},token)
      .then(d=>{if(activo){setRegistros(filasPrestamos(d.prestamos));setError('')}})
      .catch(e=>{if(activo)setError((e as Error).message)})
      .finally(()=>{if(activo)setCargando(false)});
    return()=>{activo=false};
  },[token,filtroRuta]));
  const visibles=useMemo(()=>{
    const texto=(busqueda.trim()||usuarioBuscar||'').toLowerCase();
    return registros.filter(p=>{
      const devuelto=p.estadoEjemplar==='DEVUELTO'||p.estadoEjemplar==='CERRADO_EXTRAVIO';
      const vencido=p.estado==='ACTIVO'&&p.fechaLimite.slice(0,10)<new Date().toISOString().slice(0,10);
      if(filtro==='Activos'&&devuelto)return false;
      if(filtro==='Devueltos'&&!devuelto)return false;
      if(filtro==='Vencidos'&&!vencido)return false;
      return `${p.nombreUsuario} ${p.matricula} ${p.titulo} ${p.autor} ${p.codigoEjemplar} ${fechaCorta(p.fechaLimite)}`.toLowerCase().includes(texto);
    });
  },[registros,busqueda,filtro,usuarioBuscar]);
  const detalle=(p:FilaPrestamo)=>router.push({pathname:'/detalle-prestamo',params:{id:p.id,codigo:p.codigoEjemplar}});
  const devolver=(p:FilaPrestamo)=>{
    if(!personal){Alert.alert('Devolución','Acude con el encargado para entregar el ejemplar.');return;}
    router.push({pathname:'/devolucion-prestamo',params:{id:p.id,codigo:p.codigoEjemplar}});
  };
  return <SafeAreaView style={styles.pagina} edges={['top','bottom']}>
    <StatusBar style="light"/><EncabezadoBiblioteca titulo="Préstamos"/>
    <ScrollView style={styles.contenido} contentContainerStyle={styles.interior} keyboardShouldPersistTaps="handled">
      <View style={styles.buscador}>
        <TextInput style={styles.campoBusqueda} placeholder={personal?'Buscar usuario, libro o fecha...':'Buscar título o fecha...'}
          placeholderTextColor={COLORS.placeholder} value={busqueda} onChangeText={setBusqueda}/>
        <Ionicons name="search-outline" size={27} color={COLORS.navy}/>
      </View>
      <View style={styles.filaBotones}>
        {personal&&<Pressable style={styles.botonNuevo} onPress={()=>router.push('/registrar-prestamo')}><Text style={styles.textoNuevo}>Registrar nuevo</Text></Pressable>}
        <Pressable style={styles.botonFiltro} onPress={()=>setMostrarFiltros(v=>!v)}><Text style={styles.textoFiltro}>Filtro: {filtro}</Text></Pressable>
      </View>
      {mostrarFiltros&&<View style={styles.opcionesFiltro}>
        {(['Todos','Activos','Devueltos','Vencidos'] as Filtro[]).map(x=><Pressable key={x} style={styles.opcionFiltro} onPress={()=>{setFiltro(x);setMostrarFiltros(false)}}><Text style={styles.textoOpcion}>{x}</Text></Pressable>)}
      </View>}
      <View style={styles.panelLista}>
        {cargando?<ActivityIndicator color={COLORS.navy}/>:error?<Text style={styles.vacio}>Error al consultar MySQL: {error}</Text>:
          visibles.length===0?<Text style={styles.vacio}>No hay préstamos para mostrar.</Text>:
          visibles.map(p=>{
            const prestamo:Prestamo={id:p.id,titulo:p.titulo,autor:p.autor,categoria:'',codigoEjemplar:p.codigoEjemplar,
              matricula:p.matricula,nombreUsuario:p.nombreUsuario,fechaPrestamo:fechaCorta(p.fechaPrestamo),
              fechaLimite:fechaCorta(p.fechaLimite),estado:p.estadoEjemplar==='DEVUELTO'?'Devuelto':'Activo'};
            return <PrestamoCard key={`${p.id}-${p.detalleId}`} prestamo={prestamo} mostrarUsuario={personal}
              onDetalles={()=>detalle(p)} onDevolucion={()=>devolver(p)}/>;
          })}
      </View>
    </ScrollView><BarraNavegacion actual="prestamos"/>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  contenido: { flex: 1, backgroundColor: '#F5F6F8' },
  interior: { paddingHorizontal: 17, paddingTop: 26, paddingBottom: 28 },
  buscador: {
    flexDirection: 'row', alignItems: 'center', height: 47, paddingHorizontal: 13,
    borderColor: COLORS.inputBorder, borderWidth: 1, borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  campoBusqueda: { flex: 1, fontSize: 13, color: COLORS.black },
  filaBotones: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, marginTop: 12, marginBottom: 15,
  },
  botonNuevo: {
    paddingHorizontal: 16, minHeight: 34, justifyContent: 'center',
    backgroundColor: COLORS.navy, borderRadius: 7,
  },
  textoNuevo: { color: COLORS.white, fontWeight: '600', fontSize: 12 },
  botonFiltro: {
    marginLeft: 'auto', paddingHorizontal: 13, minHeight: 34,
    minWidth: 105, justifyContent: 'center', alignItems: 'center',
    borderRadius: 7, borderWidth: 2, borderColor: COLORS.navy,
    backgroundColor: COLORS.white,
  },
  textoFiltro: { color: COLORS.navy, fontWeight: '700', fontSize: 12 },
  opcionesFiltro: {
    backgroundColor: COLORS.white, borderRadius: 8, marginBottom: 12,
    borderColor: '#DBDFE7', borderWidth: 1,
  },
  opcionFiltro: { paddingVertical: 10, paddingHorizontal: 15 },
  textoOpcion: { color: '#525866', fontSize: 13 },
  panelLista: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 10,
    paddingTop: 18, minHeight: 470, elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4,
  },
  vacio: { color: '#596170', textAlign: 'center', marginTop: 30 },
});
