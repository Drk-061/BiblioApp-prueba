import { Stack } from 'expo-router';
import { COLORS } from '../constants/colors';
import { LibrosProvider } from '../context/LibrosContext';
import { PrestamosProvider } from '../context/PrestamosContext';


// NUEVO: proveedor de autenticación
import { SessionProvider } from '../context/SessionContext';

export default function RootLayout() {
  return (
    <SessionProvider>
      <LibrosProvider>
        <PrestamosProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {
                backgroundColor: COLORS.navy,
              },
            }}
          />
        </PrestamosProvider>
      </LibrosProvider>
    </SessionProvider>
  );
}


/** Mantiene el estado de Libros y Préstamos al cambiar de pantalla. 
export default function RootLayout() {
  return (
    <LibrosProvider>
      <PrestamosProvider>
        <Stack screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.navy },
        }} />
      </PrestamosProvider>
    </LibrosProvider>
  );
}*/
