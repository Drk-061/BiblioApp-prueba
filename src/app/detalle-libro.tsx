import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback,useState } from 'react';
import { ActivityIndicator,Alert,Pressable,ScrollView,StyleSheet,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoLibros from '../components/EncabezadoLibros';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI,type LibroAPI } from '../services/api';
export default function DetalleLibroScreen(){
  const {id}=useLocalSearchParams<{id?:string}>();
  const {usuario,token}=useSession();
  const [libro,setLibro]=useState<LibroAPI|null>(null);
  const [error,setError]=useState('');
  const [cargando,setCargando]=useState(true);
  useFocusEffect(useCallback(()=>{
    if(!id)return;
    let activo=true;setCargando(true);
    pedirAPI<{libro:LibroAPI}>(`/api/libros/${encodeURIComponent(id)}`)
      .then(d=>{if(activo){setLibro(d.libro);setError('')}})
      .catch(e=>{if(activo)setError((e as Error).message)})
      .finally(()=>{if(activo)setCargando(false)});
    return()=>{activo=false};
  },[id]));
  return <SafeAreaView style={s.pagina} edges={['top','bottom']}>
    <EncabezadoLibros titulo="Detalles del libro" regresar />
    <ScrollView style={s.fondo} contentContainerStyle={s.interior}>
      {cargando?<ActivityIndicator color={COLORS.navy}/>:error?<Text>{error}</Text>:libro&&<>
        <View style={s.portada}><Text style={s.portadaTxt}>Portada</Text></View>
        <Text style={s.titulo}>{libro.titulo}</Text>
        <Text style={s.autor}>{libro.autor}</Text><Text style={s.autor}>{libro.categoria}</Text>
        <View style={s.panel}><Text style={s.encabezado}>• Información</Text>
          <Text>ISBN: {libro.isbn||'No especificado'}</Text><Text>Editorial: {libro.editorial||'—'}</Text>
          <Text>Edición: {libro.edicion||'—'}</Text><Text>Año: {libro.anioPublicacion||'—'}</Text>
          <Text>Idioma: {libro.idioma}</Text><Text>Páginas: {libro.numeroPaginas||'—'}</Text></View>
        <View style={s.panel}><Text style={s.encabezado}>• Disponibilidad</Text>
          <Text>Ejemplares disponibles: {libro.ejemplaresDisponibles}</Text>
          <View style={s.fila}><Ionicons name="checkbox" color="#258948" size={19}/><Text>{libro.ejemplaresDisponibles>0?'Disponible':'Sin ejemplares disponibles'}</Text></View>
          {usuario?.rol!=='cliente'&&<Pressable style={s.azul} onPress={()=>router.push({pathname:'/ejemplares',params:{libroId:libro.id}})}><Text style={s.blanco}>Ver ejemplares y QR</Text></Pressable>}
        </View>
        {usuario?.rol!=='cliente'&&<View style={s.fila}>
          <Pressable style={s.sec} onPress={()=>router.push({pathname:'/editar-libro',params:{id:libro.id}})}><Text style={s.secTxt}>Editar libro</Text></Pressable>
          <Pressable style={[s.sec,{backgroundColor:'#F44336'}]} onPress={()=>Alert.alert('Dar de baja libro',`¿Dar de baja ${libro.titulo}?`,[
          {text:'Cancelar',style:'cancel'},{text:'Confirmar baja',style:'destructive',onPress:async()=>{try{await pedirAPI(`/api/libros/${encodeURIComponent(libro.id)}/baja`,{method:'PATCH',body:JSON.stringify({motivo:'Baja confirmada desde el módulo Libros'})},token);Alert.alert('Baja realizada','El libro quedó fuera del catálogo.',[{text:'Aceptar',onPress:()=>router.replace('/libros')}])}catch(e){Alert.alert('No se pudo dar de baja',(e as Error).message)}}}
          ])}><Text style={[s.secTxt,{color:'#FFF'}]}>Dar de baja</Text></Pressable>
        </View>}
      </>}
    </ScrollView><BarraNavegacion actual="libros" />
  </SafeAreaView>;
}
const s=StyleSheet.create({pagina:{flex:1,backgroundColor:COLORS.navy},fondo:{flex:1,backgroundColor:'#F5F6F8'},interior:{alignItems:'center',padding:18,paddingBottom:35},portada:{width:115,height:155,borderColor:'#777',borderWidth:1,borderRadius:9,backgroundColor:'#FFF',justifyContent:'center',alignItems:'center',marginBottom:8},portadaTxt:{fontWeight:'700'},titulo:{fontSize:17,color:COLORS.black,fontWeight:'800',textAlign:'center'},autor:{fontSize:13,color:COLORS.black,textAlign:'center',fontWeight:'600'},panel:{width:'100%',backgroundColor:'#FFF',padding:15,borderRadius:13,marginTop:18,marginBottom:9, gap:5},encabezado:{fontWeight:'800',color:COLORS.navy,fontSize:15},fila:{flexDirection:'row',alignItems:'center',gap:8,marginTop:12},azul:{backgroundColor:COLORS.navy,borderRadius:7,padding:9,marginTop:12,alignSelf:'flex-start'},blanco:{color:'#FFF',fontWeight:'700'},sec:{backgroundColor:COLORS.gold,borderRadius:8,padding:12},secTxt:{fontWeight:'700',color:COLORS.navy}});
