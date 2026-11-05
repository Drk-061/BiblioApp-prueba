import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoLibros from '../components/EncabezadoLibros';
import { COLORS } from '../constants/colors';
import { pedirAPI, type LibroAPI } from '../services/api';
export default function LibroRegistrado() {
  const { id } = useLocalSearchParams<{id?:string}>();
  const [libro,setLibro] = useState<LibroAPI|null>(null);
  const [error,setError] = useState('');
  useFocusEffect(useCallback(()=>{
    if(!id) return;
    let vigente=true;
    pedirAPI<{libro:LibroAPI}>(`/api/libros/${encodeURIComponent(id)}`)
      .then(d=>{if(vigente)setLibro(d.libro)})
      .catch(e=>{if(vigente)setError((e as Error).message)});
    return()=>{vigente=false};
  },[id]));
  return <SafeAreaView style={s.pagina} edges={['top','bottom']}>
    <EncabezadoLibros titulo="Registrar libro" regresar />
    <ScrollView style={s.fondo} contentContainerStyle={s.interior}>
      <View style={s.panel}>
        <Text style={s.titulo}>✓ Libro registrado correctamente</Text>
        {libro ? <><Text style={s.nombre}>{libro.titulo}</Text><Text>{libro.autor}</Text>
          <Text style={s.info}>Se guardó. El primer ejemplar tiene un QR individual.</Text></>
          : error ? <Text style={s.error}>{error}</Text> : <ActivityIndicator color={COLORS.navy}/>}
        <Text style={s.info}>¿Deseas registrar otro libro?</Text>
        <View style={s.fila}>
          <Pressable style={s.borde} onPress={()=>router.replace('/libros')}><Text style={s.txt}>No, volver a Libros</Text></Pressable>
          <Pressable style={s.borde} onPress={()=>router.replace('/registrar-libro')}><Text style={s.txt}>Registrar otro</Text></Pressable>
        </View>
        {libro && <Pressable style={s.primario} onPress={()=>router.push({pathname:'/ejemplares',params:{libroId:libro.id}})}><Text style={s.blanco}>Ver ejemplares y sus QR</Text></Pressable>}
      </View>
    </ScrollView><BarraNavegacion actual="libros" />
  </SafeAreaView>;
}
const s=StyleSheet.create({pagina:{flex:1,backgroundColor:COLORS.navy},fondo:{flex:1,backgroundColor:'#F4F5F7'},interior:{padding:18,paddingTop:45},panel:{padding:22,borderRadius:14,backgroundColor:'#FFF',gap:13,alignItems:'center'},titulo:{fontSize:17,fontWeight:'800',color:COLORS.navy},nombre:{fontWeight:'800',color:COLORS.black,fontSize:15},info:{fontSize:12,color:'#525967',textAlign:'center'},error:{color:'#A22'},fila:{flexDirection:'row',gap:8},borde:{flex:1,borderWidth:1,borderColor:COLORS.navy,borderRadius:8,padding:11,alignItems:'center'},txt:{fontSize:12,fontWeight:'700',color:COLORS.navy},primario:{backgroundColor:COLORS.navy,padding:12,borderRadius:8},blanco:{color:'#FFF',fontWeight:'700'}});
