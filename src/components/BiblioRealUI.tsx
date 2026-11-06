import type {ReactNode} from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import BarraNavegacion from './BarraNavegacion';
import {COLORS} from '../constants/colors';
import CampanaNotificaciones from './CampanaNotificaciones';

export function Pantalla({titulo,children,tab='prestamos'}:{titulo:string;children:ReactNode;tab?:'inicio'|'prestamos'|'libros'|'perfil'}) {
 return <SafeAreaView style={s.pagina} edges={['top','bottom']}>
  <View style={s.cabeza}><Pressable style={{width:47,alignItems:'center'}} accessibilityLabel="Volver" onPress={()=>router.back()}><Ionicons name="arrow-back" size={24} color="#FFF"/></Pressable><Text style={s.tituloCabeza}>{titulo}</Text><CampanaNotificaciones /></View>
  <View style={s.franja}><Text style={s.institucion}>BIBLIOTECA UNIVERSITARIA</Text><Text style={s.unach}>Universidad Autónoma de Chiapas</Text></View>
  <ScrollView style={s.fondo} contentContainerStyle={s.interior} keyboardShouldPersistTaps="handled">{children}</ScrollView>
  <BarraNavegacion actual={tab}/>
 </SafeAreaView>;
}
export function Seccion({titulo,children}:{titulo:string;children:ReactNode}) {return <View style={s.panel}><Text style={s.seccionTitulo}>• {titulo}</Text>{children}</View>}
export function Caja({children}:{children:ReactNode}){return <View style={s.caja}>{children}</View>}
export function Dato({nombre,valor}:{nombre:string;valor:string|number|null|undefined}){return <View style={s.dato}><Text style={s.etiqueta}>{nombre}</Text><Text style={s.valor}>{valor==null||valor===''?'—':String(valor)}</Text></View>}
export function Boton({texto,onPress,primario=false,deshabilitado=false,rojo=false}:{texto:string;onPress:()=>void;primario?:boolean;deshabilitado?:boolean;rojo?:boolean}) {return <Pressable disabled={deshabilitado} onPress={onPress} style={[s.boton,primario&&s.primario,rojo&&s.rojo,deshabilitado&&{opacity:.5}]}><Text style={[s.botonTexto,(primario||rojo)&&{color:'#FFF'}]}>{texto}</Text></Pressable>}
export function Campo({etiqueta,valor,cambiar,placeholder,multiline=false,keyboardType}:{etiqueta:string;valor:string;cambiar:(v:string)=>void;placeholder?:string;multiline?:boolean;keyboardType?:'email-address'|'numeric'|'default'}) {return <View style={{gap:5,marginBottom:12}}><Text style={s.etiqueta}>{etiqueta}</Text><TextInput placeholder={placeholder||etiqueta} style={[s.input,multiline&&{height:100,textAlignVertical:'top'}]} value={valor} onChangeText={cambiar} multiline={multiline} keyboardType={keyboardType}/></View>}
export function Mensaje({error,cargando,vacio}:{error?:string;cargando?:boolean;vacio?:string}) {return cargando?<ActivityIndicator style={{margin:24}} color={COLORS.navy}/>:<Text style={{textAlign:'center',marginVertical:14,color:error?'#B33':'#6A7280'}}>{error||vacio||''}</Text>}
export function fecha(d?:string|null) {if(!d)return '—';const v=String(d);const raw=v.slice(0,10);const [y,m,day]=raw.split('-');return /^\d{4}$/.test(y)?`${day}/${m}/${y}`:raw;}
export function dinero(m:unknown){return `$${Number(m||0).toFixed(2)}`;}
const s=StyleSheet.create({pagina:{flex:1,backgroundColor:COLORS.navy},cabeza:{backgroundColor:COLORS.navy,height:53,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14},tituloCabeza:{flex:1,textAlign:'center',color:'#FFF',fontWeight:'800',fontSize:17},franja:{backgroundColor:COLORS.gold,paddingVertical:3,alignItems:'center'},institucion:{fontSize:10,color:'#000',fontWeight:'700'},unach:{fontSize:8,color:'#111'},fondo:{flex:1,backgroundColor:'#F5F6F8'},interior:{padding:15,paddingBottom:35},panel:{padding:13,backgroundColor:'#FFF',borderRadius:14,marginBottom:15,elevation:2,gap:8},seccionTitulo:{fontSize:15,color:COLORS.navy,fontWeight:'800'},caja:{borderWidth:1,borderColor:'#9BAACB',borderRadius:8,padding:11,gap:3,marginBottom:6},dato:{borderRadius:7,backgroundColor:'#F4F5F7',borderColor:'#9AA7B5',borderWidth:1,padding:9,marginBottom:6},etiqueta:{fontWeight:'700',fontSize:12,color:'#2D3650'},valor:{fontSize:12,color:'#303742',marginTop:3},boton:{borderWidth:1.5,borderColor:COLORS.navy,borderRadius:8,backgroundColor:'#FFF',padding:10,alignItems:'center',justifyContent:'center',marginTop:5},botonTexto:{color:COLORS.navy,fontWeight:'700',fontSize:12},primario:{backgroundColor:COLORS.navy},rojo:{backgroundColor:'#DE3838',borderColor:'#DE3838'},input:{borderWidth:1,borderColor:'#8AA0C8',borderRadius:8,padding:10,backgroundColor:'#FFF',minHeight:43,color:'#222'}});
