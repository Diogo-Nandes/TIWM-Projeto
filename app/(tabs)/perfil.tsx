import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Button, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BackButton from '../../components/BackButton';
import * as ImagePicker from 'expo-image-picker';
import storage from '@react-native-firebase/storage';

export default function PerfilScreen() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!currentUser) {
      Alert.alert('Erro', 'Utilizador não autenticado.');
      setLoading(false);
      return;
    }

    const subscriber = firestore()
      .collection('Utilizadores')
      .where('uid', '==', currentUser.uid)
      .limit(1)
      .onSnapshot(querySnapshot => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const data = doc.data();
          setUsername(data.Username || '');
          setImageUri(data.fotoPerfilUrl || null);
        } else {
          setUsername('');
          setImageUri(null);
        }
        setLoading(false);
      }, error => {
        Alert.alert('Erro', 'Não foi possível carregar os dados do perfil.');
        setLoading(false);
      });

    return () => subscriber();
  }, [currentUser]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à sua galeria!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (userId: string) => {
    if (!imageUri || imageUri.startsWith('http')) return imageUri;
    setUploading(true);
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const ref = storage().ref().child(`PerfilUtilizadores/${userId}.jpg`);
      await ref.put(blob);
      const url = await ref.getDownloadURL();
      return url;
    } catch (error) {
      Alert.alert('Erro', 'Falha ao fazer upload da imagem.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const guardarUsername = async () => {
    if (!username.trim()) {
      Alert.alert('Por favor, insira um nome válido.');
      return;
    }
    setSaving(true);

    try {
      if (currentUser) {
        await currentUser.updateProfile({ displayName: username });
      }

      const userRef = firestore().collection('Utilizadores').where('uid', '==', currentUser?.uid).limit(1);
      const querySnapshot = await userRef.get();

      let fotoPerfilUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        fotoPerfilUrl = await uploadImage(currentUser!.uid);
      }

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await firestore().collection('Utilizadores').doc(docId).update({ Username: username, fotoPerfilUrl });
      } else {
        await firestore().collection('Utilizadores').add({
          uid: currentUser?.uid,
          Username: username,
          fotoPerfilUrl,
        });
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
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
      <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Adicionar Foto</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.label}>Nome de utilizador</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Insira o seu nome"
        autoCapitalize="words"
      />
      {saving || uploading ? (
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
  imageContainer: { alignSelf: 'center', marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e3f2fd' },
  placeholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#2196F3', fontWeight: 'bold' },
  label: { fontWeight: 'bold', color: '#2196F3', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, backgroundColor: '#f9f9f9' },
});
