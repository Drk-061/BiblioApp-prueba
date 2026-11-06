import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BarraNavegacion from "../components/BarraNavegacion";
import EncabezadoBiblioteca from "../components/EncabezadoBiblioteca";
import EscanerQR from "../components/EscanerQR";
import { COLORS } from "../constants/colors";
import { useSession } from "../context/SessionContext";
import { pedirAPI } from "../services/api";
type Cliente = { matricula: string; nombre: string; estado: string };
type Ejemplar = { codigo: string; titulo: string; estado: string };
export default function RegistrarPrestamoScreen() {
  const { usuario, token } = useSession();
  const [matricula, setMatricula] = useState("");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [codigo, setCodigo] = useState("");
  const [ejemplares, setEjemplares] = useState<Ejemplar[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [escaneo, setEscaneo] = useState<"cliente" | "ejemplar" | null>(null);
  const identificar = async () => {
    if (cliente) return;
    if (!matricula.trim()) {
      Alert.alert("Matrícula requerida");
      return;
    }
    try {
      const d = await pedirAPI<{ cliente: Cliente }>(
        `/api/prestamos/cliente/${encodeURIComponent(matricula.trim().toUpperCase())}`,
        {},
        token,
      );
      setCliente(d.cliente);
      setMatricula(d.cliente.matricula);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };
  const agregar = async () => {
    if (!codigo.trim()) {
      Alert.alert("Código requerido");
      return;
    }
    try {
      const d = await pedirAPI<{ ejemplar: Ejemplar }>(
        `/api/prestamos/ejemplar/${encodeURIComponent(codigo.trim().toUpperCase())}`,
        {},
        token,
      );
      if (d.ejemplar.estado !== "DISPONIBLE")
        throw new Error("El ejemplar no está disponible.");
      if (ejemplares.some((e) => e.codigo === d.ejemplar.codigo))
        throw new Error("Este ejemplar ya fue agregado.");
      setEjemplares((prev) => [...prev, d.ejemplar]);
      setCodigo("");
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };
  const leerQR = async (contenido: string) => {
    if (escaneo === "cliente") {
      if (cliente)
        throw new Error("El cliente ya fue identificado para este préstamo.");
      const respuesta = await pedirAPI<{ cliente: Cliente }>(
        "/api/credenciales/validar",
        {
          method: "POST",
          body: JSON.stringify({ qr: contenido }),
        },
        token,
      );
      setCliente(respuesta.cliente);
      setMatricula(respuesta.cliente.matricula);
      return;
    }
    if (escaneo === "ejemplar") {
      const respuesta = await pedirAPI<{ ejemplar: Ejemplar }>(
        "/api/prestamos/validar-ejemplar-qr",
        {
          method: "POST",
          body: JSON.stringify({ qr: contenido }),
        },
        token,
      );
      const e = respuesta.ejemplar;
      if (e.estado !== "DISPONIBLE")
        throw new Error(`El ejemplar ${e.codigo} no está disponible.`);
      if (ejemplares.some((x) => x.codigo === e.codigo))
        throw new Error("Ese ejemplar ya fue agregado.");
      setEjemplares((prev) => [...prev, e]);
      return;
    }
    throw new Error("Escáner no configurado.");
  };
  const registrar = async () => {
    if (!cliente || ejemplares.length === 0) {
      Alert.alert(
        "Datos incompletos",
        "Identifica al cliente y agrega al menos un ejemplar.",
      );
      return;
    }
    if (guardando) return;
    setGuardando(true);
    try {
      await pedirAPI(
        "/api/prestamos",
        {
          method: "POST",
          body: JSON.stringify({
            matricula: cliente.matricula,
            ejemplares: ejemplares.map((e) => e.codigo),
          }),
        },
        token,
      );
      Alert.alert(
        "Préstamo registrado",
        `Cliente: ${cliente.nombre}\nEjemplares: ${ejemplares.length}\nGuardado.`,
        [
          {
            text: "Ver préstamos",
            onPress: () => router.replace("/prestamos"),
          },
        ],
      );
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setGuardando(false);
    }
  };
  if (usuario?.rol === "cliente")
    return (
      <SafeAreaView style={s.pagina}>
        <Text style={s.blanco}>Solo personal autorizado.</Text>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.pagina} edges={["top", "bottom"]}>
      <EncabezadoBiblioteca titulo="Registrar préstamo" />
      <ScrollView
        style={s.fondo}
        contentContainerStyle={s.interior}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.seccion}>
          <Text style={s.titulo}>• Identificar usuario</Text>
          <Text style={s.etiqueta}>Matrícula</Text>
          <TextInput
            style={[s.input, !!cliente && s.inactivo]}
            placeholder="Ingrese matrícula"
            value={matricula}
            onChangeText={setMatricula}
            editable={!cliente}
            autoCapitalize="characters"
          />
          <View style={s.fila}>
            <Pressable
              disabled={!!cliente}
              style={[s.azul, !!cliente && s.inactivo]}
              onPress={identificar}
            >
              <Text style={s.blanco}>Identificar usuario</Text>
            </Pressable>
            <Pressable
              disabled={!!cliente}
              style={[s.borde, !!cliente && s.inactivo]}
              onPress={() => setEscaneo("cliente")}
            >
              <Text style={s.azulTxt}>Escanear QR</Text>
            </Pressable>
          </View>
          {cliente && (
            <View style={s.dato}>
              <Text style={s.subtitulo}>{cliente.nombre}</Text>
              <Text>Matrícula: {cliente.matricula}</Text>
              <Text>Estado: {cliente.estado}</Text>
              <Text style={s.nota}>
                Usuario identificado. No se puede cambiar durante este registro.
              </Text>
            </View>
          )}
        </View>
        <View style={s.seccion}>
          <Text style={s.titulo}>• Identificar ejemplar</Text>
          <Text style={s.etiqueta}>Código del ejemplar</Text>
          <TextInput
            style={s.input}
            placeholder="Ingrese código"
            value={codigo}
            onChangeText={setCodigo}
            autoCapitalize="characters"
          />
          <View style={s.fila}>
            <Pressable style={s.azul} onPress={agregar}>
              <Text style={s.blanco}>Buscar ejemplar</Text>
            </Pressable>
            <Pressable style={s.borde} onPress={() => setEscaneo("ejemplar")}>
              <Text style={s.azulTxt}>Escanear QR</Text>
            </Pressable>
          </View>
          {ejemplares.map((e) => (
            <View key={e.codigo} style={s.dato}>
              <Text style={s.subtitulo}>{e.titulo}</Text>
              <Text>Ejemplar: {e.codigo}</Text>
              <Text>Estado: Disponible</Text>
              <Pressable
                onPress={() =>
                  setEjemplares((p) => p.filter((x) => x.codigo !== e.codigo))
                }
              >
                <Text style={s.quitar}>Quitar ejemplar</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <View style={s.seccion}>
          <Text style={s.titulo}>• Datos del préstamo</Text>
          <View style={s.dato}>
            <Text>Fecha de préstamo: se registra al confirmar.</Text>
          </View>
          <View style={s.dato}>
            <Text>Fecha límite:se registra al confirmar.</Text>
          </View>
          <View style={s.dato}>
            <Text>Estado: Activo</Text>
            <Text>Ejemplares: {ejemplares.length}</Text>
          </View>
          <View style={s.fila}>
            <Pressable style={s.borde} onPress={() => router.back()}>
              <Text>Cancelar</Text>
            </Pressable>
            <Pressable
              style={s.amarillo}
              disabled={guardando}
              onPress={registrar}
            >
              <Text style={s.amarilloTxt}>
                {guardando ? "Guardando..." : "Registrar préstamo"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <BarraNavegacion actual="prestamos" />
      <EscanerQR
        visible={escaneo !== null}
        titulo={
          escaneo === "cliente"
            ? "Escanear credencial de cliente"
            : "Escanear ejemplar"
        }
        cerrar={() => setEscaneo(null)}
        onLeer={leerQR}
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  pagina: { flex: 1, backgroundColor: COLORS.navy },
  fondo: { flex: 1, backgroundColor: "#F4F5F8" },
  interior: { padding: 14, paddingBottom: 45 },
  seccion: {
    backgroundColor: "#FFF",
    borderRadius: 13,
    padding: 13,
    marginBottom: 14,
    gap: 7,
    elevation: 2,
  },
  titulo: { fontWeight: "800", fontSize: 15, color: COLORS.navy },
  etiqueta: { fontWeight: "700", fontSize: 13, color: COLORS.black },
  input: {
    borderWidth: 1,
    borderColor: "#8DA0CF",
    borderRadius: 7,
    height: 42,
    paddingHorizontal: 12,
    color: COLORS.black,
    backgroundColor: "#FFF",
  },
  fila: { flexDirection: "row", gap: 8, marginTop: 4 },
  azul: {
    flex: 1,
    backgroundColor: COLORS.navy,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 37,
    padding: 5,
  },
  borde: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.navy,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 37,
    padding: 5,
  },
  blanco: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  azulTxt: { color: COLORS.navy, fontWeight: "700", fontSize: 12 },
  inactivo: { opacity: 0.55, backgroundColor: "#EDEDED" },
  dato: {
    borderWidth: 1,
    borderColor: "#D4D9E1",
    borderRadius: 9,
    padding: 12,
    marginTop: 8,
    gap: 4,
  },
  subtitulo: { color: COLORS.navy, fontWeight: "800", textAlign: "center" },
  nota: { color: "#778", fontSize: 11 },
  quitar: {
    fontWeight: "700",
    color: "#A33",
    textAlign: "right",
    marginTop: 5,
  },
  amarillo: {
    flex: 1,
    backgroundColor: COLORS.gold,
    borderColor: COLORS.navy,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  amarilloTxt: { fontWeight: "800", color: COLORS.navy },
});
