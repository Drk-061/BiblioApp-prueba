import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { Pantalla, Seccion, Dato, Boton, Campo, Mensaje, fecha, dinero } from '../components/BiblioRealUI';
import { pedirAPI } from '../services/api';
import { useSession } from '../context/SessionContext';
import type { MultaReal } from '../services/biblioExtra';

type EstadoSeguimiento = 'EN_PROCESO' | 'RESUELTA';

const nombreEstado = (estado?: string | null) => {
  if (estado === 'EN_PROCESO') return 'En proceso';
  if (estado === 'RESUELTA') return 'Resuelta';
  if (estado === 'ACTIVA') return 'Activa';
  return 'Sin seguimiento';
};

export default function DetalleMulta() {
  const { id, prestamoId } = useLocalSearchParams<{ id?: string; prestamoId?: string }>();
  const { usuario, token } = useSession();
  const [multa, setMulta] = useState<MultaReal | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [estado, setEstado] = useState<EstadoSeguimiento>('EN_PROCESO');
  const [observaciones, setObservaciones] = useState('');
  const esPersonal = usuario?.rol === 'admin' || usuario?.rol === 'encargado';

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      let actual: MultaReal | null = null;
      if (id) {
        const datos = await pedirAPI<{ multa: MultaReal }>(`/api/multas/${encodeURIComponent(id)}`, {}, token);
        actual = datos.multa;
      } else {
        const datos = await pedirAPI<{ multas: MultaReal[] }>('/api/multas', {}, token);
        actual = datos.multas.find(x => x.prestamoId === prestamoId) || null;
      }
      setMulta(actual);
      setEstado(actual?.estadoSeguimientoMulta === 'RESUELTA' ? 'RESUELTA' : 'EN_PROCESO');
      setObservaciones(actual?.mensajeSeguimientoMulta || '');
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [id, prestamoId, token]);

  useFocusEffect(useCallback(() => { void cargar(); }, [cargar]));

  const pagar = () => {
    if (!multa) return;
    Alert.alert('Actualizar estado de multa',
      `¿Confirmas que la multa de ${dinero(multa.monto)} fue pagada?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: async () => {
          setGuardando(true);
          try {
            await pedirAPI(`/api/multas/${multa.id}/pagar`, {
              method: 'PATCH', body: JSON.stringify({ referencia: 'Pago recibido en biblioteca' })
            }, token);
            await cargar();
          } catch (e) { Alert.alert('Error', (e as Error).message); }
          finally { setGuardando(false); }
        } }
      ]);
  };

  const guardarSeguimiento = () => {
    if (!multa) return;
    const mensaje = observaciones.trim();
    if (mensaje.length < 5 || mensaje.length > 1000) {
      Alert.alert('Mensaje requerido', 'Escribe entre 5 y 1000 caracteres de seguimiento.');
      return;
    }
    Alert.alert('Actualizar seguimiento', `¿Guardar el estado «${nombreEstado(estado)}» y tu mensaje?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Guardar', onPress: async () => {
        setGuardando(true);
        try {
          await pedirAPI(`/api/multas/${multa.id}/seguimiento`, {
            method: 'PATCH', body: JSON.stringify({ estado, mensaje })
          }, token);
          await cargar();
          Alert.alert('Guardado', 'El seguimiento quedó registrado.');
        } catch (e) { Alert.alert('Error', (e as Error).message); }
        finally { setGuardando(false); }
      } }
    ]);
  };

  return (
    <Pantalla titulo="Detalle de multa" tab="prestamos">
      {!!error && <Mensaje error={error} />}
      {cargando && <Mensaje cargando />}
      {!cargando && !error && !multa && <Mensaje vacio="No se encontro multa relacionada" />}
      {!!multa && (
        <>
          <Seccion titulo="Préstamo relacionado">
            <Dato nombre="Usuario" valor={`${multa.nombre} — ${multa.matricula}`} />
            <Dato nombre="Libro / Ejemplar" valor={`${multa.titulo || '—'} / ${multa.codigoEjemplar || '—'}`} />
            <Dato nombre="Límite y devolución" valor={`${fecha(multa.fechaLimite)} / ${fecha(multa.fechaDevolucion)}`} />
          </Seccion>
          <Seccion titulo="Datos de la multa">
            <Dato nombre="Motivo" valor={multa.descripcion || multa.motivo} />
            <Dato nombre="Días de retraso" valor={multa.diasRetraso} />
            <Dato nombre="Monto a deber" valor={dinero(multa.monto)} />
            <Dato nombre="Estado de pago" valor={multa.estado} />
          </Seccion>
          <Seccion titulo="Registro">
            <Dato nombre="Generada" valor={fecha(multa.fechaGenerada)} />
            {!!multa.fechaPago && <Dato nombre="Fecha de pago" valor={fecha(multa.fechaPago)} />}
          </Seccion>
          <Seccion titulo="Seguimiento">
            {!!multa.incidenciaId && (
              <>
                <Dato nombre="Estado de la incidencia" valor={nombreEstado(multa.estadoIncidencia)} />
                <Dato nombre="Descripción de la incidencia" valor={multa.mensajeSeguimientoIncidencia || 'El encargado aún no ha registrado observaciones de esta incidencia.'} />
              </>
            )}
            {(!multa.incidenciaId || !!multa.estadoSeguimientoMulta) && (
              <>
                <Dato nombre="Estado del seguimiento de la multa" valor={nombreEstado(multa.estadoSeguimientoMulta)} />
                <Dato nombre="Descripción" valor={multa.mensajeSeguimientoMulta || 'Todavía no hay un mensaje de seguimiento.'} />
                {!!multa.fechaSeguimientoMulta && <Dato nombre="Actualizado" valor={fecha(multa.fechaSeguimientoMulta)} />}
              </>
            )}
            {esPersonal && (
              <>
                <Dato nombre="Actualizar seguimiento de multa" valor="Deja un mensaje que podrá leer el cliente." />
                <Boton texto="En proceso" primario={estado === 'EN_PROCESO'} deshabilitado={guardando} onPress={() => setEstado('EN_PROCESO')} />
                <Boton texto="Resuelta" primario={estado === 'RESUELTA'} deshabilitado={guardando} onPress={() => setEstado('RESUELTA')} />
                <Campo etiqueta="Observaciones del encargado" valor={observaciones} cambiar={setObservaciones} multiline />
                <Boton texto={guardando ? 'Guardando...' : 'Guardar seguimiento'} primario deshabilitado={guardando} onPress={guardarSeguimiento} />
              </>
            )}
          </Seccion>
          {esPersonal && multa.estado === 'PENDIENTE' && (
            <Boton texto={guardando ? 'Guardando...' : 'Marcar pagada'} deshabilitado={guardando} onPress={pagar} />
          )}
        </>
      )}
    </Pantalla>
  );
}
