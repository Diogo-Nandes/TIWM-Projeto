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
          <Text style={styles.buttonText}>Validar Toma</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#FFEB3B" }]}
          onPress={() => router.push("/horario")}
        >
          <Text style={styles.buttonText}>Horário</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#2196F3" }]}
          onPress={() => router.push("/medicamentos")}
        >
          <Text style={styles.buttonText}>Medicamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#FF9800" }]}
          onPress={() => router.push("/adicionar-medicamento")}
        >
          <Text style={styles.buttonText}>Adicionar Medicamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#3F51B5" }]}
          onPress={() => router.push("/editar-medicamento")}
        >
          <Text style={styles.buttonText}>Editar Medicamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#F44336" }]}
          onPress={() => router.push("/eliminar-medicamento")}
        >
          <Text style={styles.buttonText}>Eliminar Medicamento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#9C27B0" }]}
          onPress={() => router.push("/notificacoes")}
        >
          <Text style={styles.buttonText}>Notificações</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#009688" }]}
          onPress={() => router.push("/perfil")}
        >
          <Text style={styles.buttonText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 32, fontWeight: "bold", color: "#2196F3", marginBottom: 30 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  button: { width: 150, height: 100, margin: 10, borderRadius: 12, justifyContent: "center", alignItems: "center", elevation: 3 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold", textAlign: "center" }
});

// npx expo start
// npx expo run:android

// npx expo prebuild --clean
// cd android
// ./gradlew clean
// cd ..
// npm install

// C:\Users\diogo\Desktop\Projeto\SeniorReminder

// npm install firebase
// npm install @react-native-firebase/firestore
// npm install @react-native-community/datetimepicker