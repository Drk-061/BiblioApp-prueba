import { useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

type Props = {
  visible: boolean;
  titulo: string;
  cerrar: () => void;
  onLeer: (contenido: string) => Promise<void>;
};

export default function EscanerQR({ visible, titulo, cerrar, onLeer }: Props) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const enProceso = useRef(false);
  const [ocupado, setOcupado] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const procesar = async (data: string) => {
    if(enProceso.current || bloqueado) return;
    enProceso.current = true;
    setOcupado(true);
    setBloqueado(true);
    try {
      await onLeer(data);
      cerrar();
    } catch(error) {
      Alert.alert('Código QR no válido', error instanceof Error ? error.message : 'No se pudo leer el QR.');
    } finally {
      enProceso.current = false;
      setOcupado(false);
    }
  };
  const salir = () => { enProceso.current=false; setBloqueado(false); cerrar(); };
  return <Modal visible={visible} animationType="slide" onRequestClose={salir}>
    <SafeAreaView style={styles.pagina}>
      <View style={styles.cabecera}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Pressable onPress={salir}><Text style={styles.salir}>Cerrar</Text></Pressable>
      </View>
      {!permiso ? <ActivityIndicator color={COLORS.gold} size="large" /> :
       !permiso.granted ? <View style={styles.permiso}>
         <Text style={styles.instruccion}>Autoriza la cámara para leer el código QR.</Text>
         <Pressable style={styles.boton} onPress={() => void pedirPermiso()}><Text style={styles.botonTexto}>Conceder permiso</Text></Pressable>
       </View> : <CameraView
          style={styles.camara}
          facing="back"
          barcodeScannerSettings={{barcodeTypes:['qr']}}
          onBarcodeScanned={bloqueado?undefined:({data})=>void procesar(data)}
        />}
      <Text style={styles.instruccion}>Alinea el QR dentro del área de la cámara.</Text>
      {ocupado ? <ActivityIndicator color={COLORS.gold} size="large" style={{margin:12}}/> : null}
      {bloqueado&&!ocupado ? <Pressable style={styles.boton} onPress={()=>setBloqueado(false)}>
        <Text style={styles.botonTexto}>Volver a escanear</Text>
      </Pressable> : null}
    </SafeAreaView>
  </Modal>;
}
const styles=StyleSheet.create({
 pagina:{flex:1,backgroundColor:COLORS.navy},cabecera:{minHeight:58,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:18},
 titulo:{color:'#FFF',fontWeight:'800',fontSize:17},salir:{color:COLORS.gold,fontWeight:'700'},
 camara:{flex:1},permiso:{flex:1,justifyContent:'center',alignItems:'center',padding:24},
 instruccion:{color:'#FFF',fontSize:13,textAlign:'center',padding:18},
 boton:{backgroundColor:COLORS.gold,alignSelf:'center',paddingHorizontal:24,paddingVertical:12,borderRadius:9,marginBottom:15},
 botonTexto:{color:COLORS.navy,fontWeight:'800'}
});
