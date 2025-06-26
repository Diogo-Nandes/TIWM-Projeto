import React, { useEffect, useState } from 'react';
import { Alert, ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Dimensions } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BackButton from '../../components/BackButton';
import * as ImagePicker from 'expo-image-picker';
import storage from '@react-native-firebase/storage';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Text style={styles.title}>Perfil</Text>
      <TouchableOpacity onPress={pickImage} style={styles.imageSection} accessibilityRole="imagebutton">
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.placeholderContent}>
              <Ionicons name="person-circle-outline" size={56} color="#bbb" />
              <Text style={styles.placeholderText}>Adicionar Foto</Text>
            </View>
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
        placeholderTextColor="#aaa"
      />
      {saving || uploading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#2196F3" />
      ) : (
        <TouchableOpacity style={styles.buttonPrimary} onPress={guardarUsername} accessibilityRole="button">
          <Text style={styles.buttonTextPrimary}>Guardar Alterações</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 28 }} />
      <TouchableOpacity style={styles.buttonLogout} onPress={logout} accessibilityRole="button">
        <Text style={styles.buttonTextLogout}>Terminar Sessão</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60, alignItems: 'stretch' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 38, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 20, marginTop: 40 },
  imageSection: { alignItems: 'center', marginBottom: 20 },
  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80, // redondo
    backgroundColor: '#e3f2fd',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80, // redondo
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#bbb',
    marginBottom: 8,
  },
  placeholderContent: { 
    flex: 1, 
    width: '100%', 
    height: '100%', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  placeholderText: { 
    color: '#888', 
    fontSize: 18, 
    marginTop: 8, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  label: { fontWeight: 'bold', color: '#2196F3', marginBottom: 12, fontSize: 22, textAlign: 'center' },
  input: { 
    borderWidth: 1, 
    borderColor: '#bbb', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 22, 
    marginBottom: 24, 
    backgroundColor: '#f9f9f9', 
    minHeight: 56, 
    width: '100%', 
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 56,
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonLogout: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: 56,
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  buttonTextLogout: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

