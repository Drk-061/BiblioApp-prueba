import { Image, StyleSheet } from 'react-native';

type Props = { grande?: boolean };

/** Imagen provisional: reemplaza el PNG sin cambiar el componente. */
export default function FotoUsuario({ grande = false }: Props) {
  return (
    <Image
      source={require('../../assets/recursos/biblioapp-avatar-demo.png')}
      resizeMode="contain"
      style={grande ? styles.grande : styles.chica}
    />
  );
}

const styles = StyleSheet.create({
  grande: { width: 125, height: 125, alignSelf: 'center' },
  chica: { width: 20, height: 20 },
});
