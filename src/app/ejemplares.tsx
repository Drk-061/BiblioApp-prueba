import { router,useFocusEffect,useLocalSearchParams } from 'expo-router';
import { useCallback,useMemo,useState } from 'react';
import { ActivityIndicator,Alert,Modal,Pressable,ScrollView,StyleSheet,Text,TextInput,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoLibros from '../components/EncabezadoLibros';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI,type EjemplarAPI,type LibroAPI } from '../services/api';
const FILTROS=['Todos','DISPONIBLE','PRESTADO','EXTRAVIADO','DANADO'];
export default function EjemplaresScreen(){
  const {libroId}=useLocalSearchParams<{libroId?:string}>();
  const {usuario,token}=useSession();
  const [libro,setLibro]=useState<LibroAPI|null>(null);
  const [lista,setLista]=useState<EjemplarAPI[]>([]);
  const [filtro,setFiltro]=useState('Todos');
  const [buscar,setBuscar]=useState('');
  const [cargando,setCargando]=useState(true);
  const [error,setError]=useState('');
  const [modal,setModal]=useState(false);
  const [codigo,setCodigo]=useState('');
  const [barras,setBarras]=useState('');
  const [ubicacion,setUbicacion]=useState('Estante A-03');
  const [seleccionado,setSeleccionado]=useState<EjemplarAPI|null>(null);
  const [guardando,setGuardando]=useState(false);
  const [editarUbicacion,setEditarUbicacion]=useState('');
  const [editarEstado,setEditarEstado]=useState('DISPONIBLE');
  const cargar=useCallback(async()=>{
    if(!libroId)return;
    setCargando(true);
    try {
      const [libros,ejemplares]=await Promise.all([
        pedirAPI<{libro:LibroAPI}>(`/api/libros/${encodeURIComponent(libroId)}`),
        pedirAPI<{ejemplares:EjemplarAPI[]}>(`/api/libros/${encodeURIComponent(libroId)}/ejemplares`),
      ]);
      setLibro(libros.libro);setLista(ejemplares.ejemplares);setError('');
    }catch(e){setError((e as Error).message)}finally{setCargando(false)}
  },[libroId]);
  useFocusEffect(useCallback(()=>{void cargar()},[cargar]));
  const visibles=useMemo(()=>lista.filter(e=>(filtro==='Todos'||e.estado===filtro)&&
    `${e.codigo} ${e.ubicacion}`.toLowerCase().includes(buscar.toLowerCase().trim())),[lista,filtro,buscar]);
  const agregar=async()=>{
    if(guardando||!libroId)return;
    setGuardando(true);
    try {await pedirAPI(`/api/libros/${encodeURIComponent(libroId)}/ejemplares`,{
      method:'POST',body:JSON.stringify({codigo:codigo.trim()||undefined,codigoBarras:barras.trim()||undefined,ubicacion})
    },token);setModal(false);setCodigo('');setBarras('');await cargar();Alert.alert('Correcto','El ejemplar y su QR se guardaron en MySQL.');}
    catch(e){Alert.alert('Error',(e as Error).message)}finally{setGuardando(false)}
  };
  if(usuario?.rol==='cliente')return <SafeAreaView style={s.pagina}><Text style={s.blanco}>Solo el personal puede gestionar ejemplares.</Text></SafeAreaView>;
  return <SafeAreaView style={s.pagina} edges={['top','bottom']}>
    <EncabezadoLibros titulo="Ejemplares" regresar />
    <View style={s.fondo}>
      <ScrollView contentContainerStyle={s.interior} keyboardShouldPersistTaps="handled">
        <View style={s.panel}><Text style={s.titulo}>{libro?.titulo??'Libro'}</Text>
          <Text>{libro?.autor}</Text><Text>Ejemplares: {lista.length}</Text>
          <Text>Disponibles: {lista.filter(e=>e.estado==='DISPONIBLE').length}</Text></View>
        <TextInput style={s.input} placeholder="Buscar clave o ubicación..." value={buscar} onChangeText={setBuscar}/>
        <ScrollView horizontal contentContainerStyle={s.filtros} showsHorizontalScrollIndicator={false}>
          {FILTROS.map(x=><Pressable key={x} onPress={()=>setFiltro(x)} style={[s.chip,filtro===x&&s.activo]}>
            <Text style={s.chipTxt}>{x==='DANADO'?'Dañados':x.toLowerCase()}</Text></Pressable>)}
        </ScrollView>
        {cargando?<ActivityIndicator color={COLORS.navy}/>:error?<Text style={s.error}>{error}</Text>:
          visibles.map(e=><View key={e.codigo} style={s.fila}>
            <View><Text style={s.titulo}>{e.codigo}</Text><Text>Estado: {e.estado}</Text>
            <Text>Ubicación: {e.ubicacion||'—'}</Text></View>
            <Pressable style={s.contorno} onPress={()=>{setSeleccionado(e);setEditarUbicacion(e.ubicacion||'');setEditarEstado(e.estado)}}><Text style={s.textoContorno}>Detalles / QR</Text></Pressable>
          </View>)}
      </ScrollView>
      <Pressable style={s.mas} onPress={()=>setModal(true)}><Text style={{color:COLORS.gold,fontSize:36}}>+</Text></Pressable>
    </View><BarraNavegacion actual="libros" />
    <Modal visible={modal} transparent animationType="fade" onRequestClose={()=>setModal(false)}><View style={s.overlay}>
      <View style={s.dialogo}><Text style={s.titulo}>Agregar ejemplar</Text><Text>{libro?.titulo}</Text>
        <TextInput style={s.input} placeholder="Clave (opcional: se genera)" value={codigo} onChangeText={setCodigo} autoCapitalize="characters"/>
        <TextInput style={s.input} placeholder="Código de barras (opcional)" value={barras} onChangeText={setBarras}/>
        <TextInput style={s.input} placeholder="Ubicación" value={ubicacion} onChangeText={setUbicacion}/>
        <View style={s.botones}><Pressable style={s.contorno} onPress={()=>setModal(false)}><Text>Cancelar</Text></Pressable>
          <Pressable disabled={guardando} style={s.amarillo} onPress={agregar}><Text>{guardando?'Registrando...':'Registrar'}</Text></Pressable></View>
      </View></View></Modal>
    <Modal visible={!!seleccionado} transparent animationType="fade" onRequestClose={()=>setSeleccionado(null)}><View style={s.overlay}>
      <View style={s.dialogo}><Text style={s.titulo}>Detalle del ejemplar</Text>
        <Text>{seleccionado?.codigo}</Text><Text>Estado: {seleccionado?.estado}</Text><Text>Ubicación: {seleccionado?.ubicacion}</Text>
        {seleccionado&&<View style={s.qr}><QRCode value={seleccionado.qr||JSON.stringify({tipo:'ejemplar',codigoEjemplar:seleccionado.codigo})} size={175}/></View>}
        <Text style={s.nota}>QR del ejemplar. La lectura por cámara queda pendiente.</Text>
        <TextInput style={s.input} value={editarUbicacion} onChangeText={setEditarUbicacion} placeholder="Ubicación"/>
        {seleccionado?.estado!=='PRESTADO'&&seleccionado?.estado!=='EXTRAVIADO'&&<View style={s.botones}>
        {['DISPONIBLE','DANADO','BAJA'].map(e=><Pressable key={e} onPress={()=>setEditarEstado(e)} style={[s.chip,editarEstado===e&&s.activo]}><Text style={{fontSize:10}}>{e}</Text></Pressable>)}
        </View>}
        <Pressable style={s.amarillo} onPress={async()=>{if(!seleccionado||!libroId)return;setGuardando(true);try{await pedirAPI(`/api/libros/${encodeURIComponent(libroId)}/ejemplares/${encodeURIComponent(seleccionado.codigo)}`,{method:'PATCH',body:JSON.stringify({ubicacion:editarUbicacion,estado:editarEstado})},token);setSeleccionado(null);await cargar()}catch(e){Alert.alert('Error',(e as Error).message)}finally{setGuardando(false)}}} disabled={guardando||seleccionado?.estado==='PRESTADO'||seleccionado?.estado==='EXTRAVIADO'}><Text>Guardar cambios</Text></Pressable>
        <Pressable style={s.contorno} onPress={()=>setSeleccionado(null)}><Text>Cerrar</Text></Pressable>
      </View></View></Modal>
  </SafeAreaView>;
}
const s=StyleSheet.create({pagina:{flex:1,backgroundColor:COLORS.navy},fondo:{flex:1,backgroundColor:'#F4F5F8'},interior:{padding:17,paddingBottom:85},panel:{backgroundColor:'#FFF',padding:15,borderRadius:11,marginBottom:13},titulo:{fontSize:15,fontWeight:'800',color:COLORS.navy,marginBottom:4},input:{height:43,borderColor:'#9AAAD0',borderWidth:1,borderRadius:8,backgroundColor:'#FFF',paddingHorizontal:12,marginBottom:11},filtros:{gap:6,marginBottom:14},chip:{borderWidth:1,borderRadius:8,padding:8,backgroundColor:'#FFF'},activo:{backgroundColor:COLORS.gold},chipTxt:{fontSize:11,fontWeight:'700',textTransform:'capitalize'},fila:{borderColor:'#91A1CC',borderWidth:1,borderRadius:9,padding:12,marginBottom:12,backgroundColor:'#FFF',flexDirection:'row',justifyContent:'space-between',alignItems:'center'},contorno:{padding:9,borderWidth:1,borderColor:COLORS.navy,borderRadius:8},textoContorno:{color:COLORS.navy,fontWeight:'700'},mas:{position:'absolute',bottom:18,right:15,width:55,height:55,backgroundColor:COLORS.navy,borderRadius:28,alignItems:'center',justifyContent:'center'},blanco:{color:'#FFF'},error:{color:'#A33'},overlay:{flex:1,backgroundColor:'#0007',alignItems:'center',justifyContent:'center',padding:20},dialogo:{padding:17,borderRadius:12,backgroundColor:'#FFF',width:'100%',maxWidth:420,gap:10},botones:{flexDirection:'row',justifyContent:'space-between'},amarillo:{padding:10,backgroundColor:COLORS.gold,borderRadius:8},qr:{alignSelf:'center',backgroundColor:'#FFF',padding:10},nota:{textAlign:'center',fontSize:11,color:'#687080'}});
