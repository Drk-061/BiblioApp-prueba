import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { type ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text,TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../context/SessionContext';
export const c={azul:'#1B2F65',oro:'#DAB512',fondo:'#F4F5F7',borde:'#8898BE',blanco:'#FFFFFF'};
export function Encabezado({titulo,back=true}:{titulo:string;back?:boolean}) {
  return <><View style={s.header}>
    <Pressable onPress={()=>back?router.back():router.replace('/mvp')} accessibilityLabel="Regresar">
      {back?<Ionicons name="arrow-back" size={25} color="white"/>:
        <Image source={require('../../assets/images/logo-unach.png')} style={s.logo}/>}</Pressable>
    <Text style={s.headerText}>{titulo}</Text>
    <Image source={require('../../assets/images/logo-unach.png')} style={s.logo}/>
  </View><View style={s.gold}><Text style={s.institucion}>BIBLIOTECA UNIVERSITARIA</Text><Text style={s.unach}>Universidad Autónoma de Chiapas</Text></View></>;
}
export function Pantalla({titulo,children,back=true}:{titulo:string;children:ReactNode;back?:boolean}) {
  return <SafeAreaView style={{flex:1,backgroundColor:c.azul}}><Encabezado titulo={titulo} back={back}/>
    <ScrollView style={{flex:1,backgroundColor:c.fondo}} contentContainerStyle={s.contenido} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    <View style={s.bottom}>
      <Pressable onPress={()=>router.replace('/mvp')}><Text style={s.bottomText}>Inicio</Text></Pressable>
      <Pressable onPress={()=>router.push('/mvp-libros')}><Text style={s.bottomText}>Libros</Text></Pressable>
      <Pressable onPress={()=>router.push('/mvp-prestamos')}><Text style={s.bottomText}>Préstamos</Text></Pressable>
    </View>
  </SafeAreaView>;
}
export function Tarjeta({children}:{children:ReactNode}) {return <View style={s.card}>{children}</View>}
export function Campo({etiqueta,valor,cambiar,teclado='default',multiline=false,disabled=false}:{etiqueta:string;valor:string;cambiar:(v:string)=>void;teclado?:'default'|'number-pad'|'email-address';multiline?:boolean;disabled?:boolean}) {
  return <View style={{marginBottom:10}}><Text style={s.label}>{etiqueta}</Text><TextInput value={valor} onChangeText={cambiar} keyboardType={teclado}
    multiline={multiline} editable={!disabled} style={[s.input,multiline&&{height:80,textAlignVertical:'top'}]} placeholder={etiqueta} placeholderTextColor="#A1A7B1"/></View>;
}
export function Boton({texto,onPress,secundario=false,disabled=false}:{texto:string;onPress:()=>void;secundario?:boolean;disabled?:boolean}) {
  return <Pressable onPress={onPress} disabled={disabled} style={[s.boton,secundario&&s.botonSecundario,disabled&&{opacity:.45}]}><Text style={[s.botonTexto,secundario&&{color:c.azul}]}>{texto}</Text></Pressable>;
}
export function Protegido({roles,children}:{roles?:string[];children:ReactNode}) {
  const {cargando,usuario}=useSession();
  if(cargando)return <View style={{flex:1,justifyContent:'center'}}><ActivityIndicator/></View>;
  if(!usuario) return <Pantalla titulo="Sesión requerida"><Text>Inicia sesión para continuar.</Text><Boton texto="Iniciar sesión" onPress={()=>router.replace('/')}/></Pantalla>;
  if(roles&&!roles.includes(usuario.rol))return <Pantalla titulo="Sin acceso"><Text>Tu cuenta no tiene permiso para entrar aquí.</Text></Pantalla>;
  return <>{children}</>;
}
export const s=StyleSheet.create({
  header:{height:56,backgroundColor:c.azul,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:15},
  headerText:{color:'white',fontWeight:'800',fontSize:18},logo:{width:40,height:40,resizeMode:'contain'},
  gold:{backgroundColor:c.oro,alignItems:'center',paddingVertical:4},institucion:{fontSize:10,color:'#111'},unach:{fontSize:8,color:'#111'},
  contenido:{padding:18,paddingBottom:36,flexGrow:1},bottom:{height:54,flexDirection:'row',backgroundColor:c.azul,alignItems:'center',justifyContent:'space-around'},bottomText:{color:'white',fontWeight:'700',fontSize:12},
  card:{padding:15,backgroundColor:'white',borderRadius:12,marginBottom:14,borderWidth:1,borderColor:'#E4E7ED',elevation:1},
  label:{color:c.azul,fontWeight:'700',marginBottom:5,fontSize:13},
  input:{borderColor:c.borde,borderWidth:1,borderRadius:7,paddingHorizontal:12,paddingVertical:8,minHeight:42,color:'#222',backgroundColor:'white'},
  boton:{backgroundColor:c.azul,paddingVertical:12,paddingHorizontal:17,borderRadius:8,marginVertical:5,alignItems:'center'},
  botonSecundario:{backgroundColor:'white',borderWidth:1.5,borderColor:c.azul},botonTexto:{color:'white',fontWeight:'700',textAlign:'center'}
});
