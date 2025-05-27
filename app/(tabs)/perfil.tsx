import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BackButton from '../../components/BackButton';

export default function PerfilScreen() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);

  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!currentUser) {
      Alert.alert('Erro', 'Utilizador não autenticado.');
      setLoading(false);
      return;
    }

    // Consulta o documento do utilizador na coleção "Utilizadores" pelo uid
    const subscriber = firestore()
      .collection('Utilizadores')
      .where('uid', '==', currentUser.uid)
      .limit(1)
      .onSnapshot(querySnapshot => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          setUsername(data.Username || '');
        } else {
          setUsername('');
        }
        setLoading(false);
      }, error => {
        Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
        setLoading(false);
      });

    return () => subscriber();
  }, [currentUser]);

  const guardarUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Por favor, insira um nome válido.');
      return;
    }
    setSaving(true);

    try {
      // Atualiza o displayName no Firebase Authentication
      if (currentUser) {
        await currentUser.updateProfile({ displayName: username });
      }

      // Atualiza o campo Username na coleção Utilizadores
      const userRef = firestore().collection('Utilizadores').where('uid', '==', currentUser?.uid).limit(1);
      const querySnapshot = await userRef.get();

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await firestore().collection('Utilizadores').doc(docId).update({ Username: username });
      } else {
        // Se não existir documento, cria um novo
        await firestore().collection('Utilizadores').add({
          uid: currentUser?.uid,
          Username: username,
        });
      }

      Alert.alert('Sucesso', 'Nome atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o nome.');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
      // O RootLayout vai redirecionar automaticamente para a página de login
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível terminar a sessão.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.label}>Nome de utilizador</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Insira o seu nome"
        autoCapitalize="words"
      />
      {saving ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <Button title="Guardar Alterações" onPress={guardarUsername} />
      )}
      <View style={{ height: 20 }} />
      <Button title="Sign out" color="#F44336" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 10, marginTop: 40 },
  label: {
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
});
