import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SeniorReminder</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#4CAF50" }]}
          onPress={() => router.push("/validar-toma")}
        >
          <Ionicons name="checkmark-circle-outline" size={40} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Validar Toma</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#FFC107" }]}
          onPress={() => router.push("/horario")}
        >
          <Ionicons name="time-outline" size={40} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Horário</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#2196F3" }]}
          onPress={() => router.push("/medicamentos")}
        >
          <Ionicons name="list-circle-outline" size={40} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Medicamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#EF6C00" }]}
          onPress={() => router.push("/adicionar-medicamento")}
        >
          <Ionicons name="add-circle-outline" size={40} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Adicionar Medicamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#3F51B5" }]}
          onPress={() => router.push("/editar-medicamento")}
        >
          <Ionicons name="create-outline" size={40} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Editar Medicamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#F44336" }]}
          onPress={() => router.push("/eliminar-medicamento")}
        >
          <Ionicons name="trash-outline" size={40} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Eliminar Medicamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#9C27B0" }]}
          onPress={() => router.push("/validacoes-user")}
        >
          <Ionicons name="checkmark-done-circle-outline" size={40} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Validações do Utilizador</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#009688" }]}
          onPress={() => router.push("/perfil")}
        >
          <Ionicons name="person-circle-outline" size={40} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 38, fontWeight: "bold", color: "#2196F3", marginBottom: 30, marginTop: 30 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  button: {
    width: 150,
    height: 130,
    margin: 10,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    paddingVertical: 12,
  },
  icon: {
    marginBottom: 8,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});