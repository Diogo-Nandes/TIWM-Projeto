import auth from '@react-native-firebase/auth';
import { Button, StyleSheet, Text, View } from "react-native";
import BackButton from "../../components/BackButton";

export default function NotificacoesScreen() {
  return (
    <View style={styles.container}>
      <BackButton />
      <View style={styles.content}>
        <Text style={styles.text}>Perfil</Text>
        <Button title='Sign out' onPress={async () => {
          await auth().signOut();
        }}></Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 24 },
});