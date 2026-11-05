import { router,useFocusEffect,useLocalSearchParams } from 'expo-router';
import { useCallback,useState } from 'react';
import { Alert,Pressable,ScrollView,StyleSheet,Text,View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BarraNavegacion from '../components/BarraNavegacion';
import EncabezadoBiblioteca from '../components/EncabezadoBiblioteca';
import { COLORS } from '../constants/colors';
import { useSession } from '../context/SessionContext';
import { pedirAPI,type PrestamoAPI } from '../services/api';
import {fechaCorta} from '../services/vistasReales';
export default function DevolucionPrestamo(){
  const {id,codigo}=useLocalSearchParams<{id?:string;codigo?:string}>();
  const {token,usuario}=useSession();
  const [prestamo,setPrestamo]=useState<PrestamoAPI|null>(null);
  const [fisico,setFisico]=useState<'DISPONIBLE'|'DANADO'>('DISPONIBLE');
  const [guardando,setGuardando]=useState(false);
  const [error,setError]=useState('');
  useFocusEffect(useCallback(()=>{
    let vivo=true;
    pedirAPI<{prestamos:PrestamoAPI[]}>('/api/prestamos',{},token)
      .then(d=>{if(vivo)setPrestamo(d.prestamos.find(p=>p.id===id)||null)})
      .catch(e=>{if(vivo)setError((e as Error).message)});
    return()=>{vivo=false};
  },[id,token]));
  const ejemplar=prestamo?.ejemplares.find(e=>e.codigo===codigo);
  const guardar=async()=>{
    if(!id||!ejemplar||guardando)return;
    setGuardando(true);
    try{await pedirAPI(`/api/prestamos/${encodeURIComponent(id)}/devoluciones`,{method:'POST',
      body:JSON.stringify({codigoEjemplar:ejemplar.codigo,estadoFisico:fisico})},token);
      Alert.alert('Devolución registrada','El ejemplar se actualizó en MySQL.',[{text:'Ver préstamos',onPress:()=>router.replace('/prestamos')}]);}
    catch(e){Alert.alert('Error',(e as Error).message)}finally{setGuardando(false)}
  };
  if(usuario?.rol==='cliente')return <SafeAreaView style={s.pagina}><Text style={s.blanco}>Acción disponible solo para encargados y admin.</Text></SafeAreaView>;
  return <SafeAreaView style={s.pagina} edges={['top','bottom']}>
    <EncabezadoBiblioteca titulo="Registrar devolución"/>
    <ScrollView style={s.fondo} contentContainerStyle={s.interior}>
      {error?<Text>{error}</Text>:!prestamo||!ejemplar?<Text>Cargando datos del préstamo...</Text>:
      <><View style={s.panel}><Text style={s.titulo}>• Identificar usuario</Text>
        <View style={s.caja}><Text>{prestamo.nombreUsuario}</Text><Text>Matrícula: {prestamo.matricula}</Text></View></View>
        <View style={s.panel}><Text style={s.titulo}>• Identificar ejemplar</Text>
          <View style={s.caja}><Text>{ejemplar.titulo}</Text><Text>{ejemplar.autor}</Text><Text>Ejemplar: {ejemplar.codigo}</Text><Text>Estado: {ejemplar.estado}</Text></View>
        </View>
        <View style={s.panel}><Text style={s.titulo}>• Datos del préstamo</Text>
          <View style={s.caja}><Text>Fecha de préstamo: {fechaCorta(prestamo.fechaPrestamo)}</Text></View>
          <View style={s.caja}><Text>Fecha límite: {fechaCorta(prestamo.fechaLimite)}</Text></View>
          <Text style={s.titulo}>Estado físico al devolver</Text><View style={s.fila}>
            {(['DISPONIBLE','DANADO'] as const).map(x=><Pressable key={x} style={[s.opcion,fisico===x&&s.opcionActiva]} onPress={()=>setFisico(x)}><Text>{x==='DISPONIBLE'?'Sin daños':'Dañado'}</Text></Pressable>)}
          </View>
          <View style={s.fila}><Pressable style={s.opcion} onPress={()=>router.back()}><Text>Cancelar</Text></Pressable>
            <Pressable style={s.amarillo} onPress={()=>Alert.alert('Confirmar devolución',`¿Registrar ${ejemplar.codigo} como ${fisico}?`,[
              {text:'Cancelar',style:'cancel'},{text:'Confirmar',onPress:guardar}])} disabled={guardando||ejemplar.estado!=='PRESTADO'}><Text>{guardando?'Guardando...':'Confirmar devolución'}</Text></Pressable></View>
        </View></>}
    </ScrollView><BarraNavegacion actual="prestamos" />
  </SafeAreaView>;
}
const s=StyleSheet.create({pagina:{flex:1,backgroundColor:COLORS.navy},fondo:{flex:1,backgroundColor:'#F4F5F7'},interior:{padding:15},panel:{backgroundColor:'#FFF',borderRadius:12,padding:14,marginBottom:14,gap:9},titulo:{fontWeight:'800',color:COLORS.navy,fontSize:15},caja:{padding:12,borderRadius:8,borderWidth:1,borderColor:'#AAB7D1'},fila:{flexDirection:'row',gap:10},opcion:{flex:1,borderWidth:1,borderColor:COLORS.navy,borderRadius:7,padding:9,alignItems:'center'},opcionActiva:{backgroundColor:'#BCD8FF'},amarillo:{flex:1,backgroundColor:COLORS.gold,borderRadius:7,alignItems:'center',padding:9},blanco:{color:'#FFF'}});
