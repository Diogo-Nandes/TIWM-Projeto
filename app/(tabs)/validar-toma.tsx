import { View, Text, StyleSheet } from "react-native";
import BackButton from "../../components/BackButton";

export default function ValidarTomaScreen() {
  return (
    <View style={styles.container}>
      <BackButton />
      <View style={styles.content}>
        <Text style={styles.text}>Validar Toma</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 24 },
});