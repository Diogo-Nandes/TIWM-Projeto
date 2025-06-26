import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function BackButton({ label = "Início" }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => router.replace("/")}
      accessibilityLabel="Voltar à página inicial"
    >
      <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      <Text style={styles.backText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#2196F3",
    elevation: 2,
  },
  backText: {
    fontSize: 20,
    color: "#FFFFFF",
    marginLeft: 5,
    fontWeight: "bold",
  },
});