import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BackButton from '../../components/BackButton';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PesquisaUserScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const currentUser = auth().currentUser;

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const unsubscribe = firestore()
      .collection('Utilizadores')
      .where('Username', '>=', searchQuery)
      .where('Username', '<=', searchQuery + '\uf8ff')
      .where('isCuidador', '==', false)
      .limit(20)
      .onSnapshot(
        querySnapshot => {
          const results = querySnapshot.docs.map(doc => ({
            id: doc.id,
            uid: doc.data().uid, // Adicionado campo uid do utilizador
            ...doc.data()
          }));
          setSearchResults(results);
          setLoading(false);
        },
        error => {
          setLoading(false);
          console.log("Erro na pesquisa:", error);
        }
      );

    return () => unsubscribe();
  }, [searchQuery]);

  // Função para associar UID do utilizador pesquisado ao cuidador logado
  const handleAssociateUser = async (userUid: string, username: string) => {
    if (!currentUser?.uid) {
      Alert.alert('Erro', 'Sessão expirada.');
      return;
    }
    
    try {
      // Encontra o documento do cuidador pelo UID
      const userQuery = await firestore()
        .collection('Utilizadores')
        .where('uid', '==', currentUser.uid)
        .limit(1)
        .get();

      if (userQuery.empty) {
        Alert.alert('Erro', 'Documento do cuidador não encontrado.');
        return;
      }

      // Atualiza o documento do cuidador com o UID do associado
      const userDocId = userQuery.docs[0].id;
      await firestore()
        .collection('Utilizadores')
        .doc(userDocId)
        .update({
          uidAssociado: userUid // Usa o UID do utilizador pesquisado
        });

      Alert.alert('Sucesso', `Utilizador "${username}" associado!`);
      // Redireciona para a página de perfil após 1 segundo
      setTimeout(() => {
          router.replace('/(cuidador)/perfil');
      }, 500);

    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível associar o utilizador.\n' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Pesquisar Utilizadores</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Digite o username..."
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searchQuery.length >= 2 && !loading ? (
              <Text style={styles.noResults}>Nenhum utilizador encontrado</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.userItem}
              onPress={() => handleAssociateUser(item.uid, item.Username)} // Passa o UID correto
            >
              <Ionicons name="person-circle-outline" size={32} color="#2196F3" />
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.Username}</Text>
                {item.email && <Text style={styles.email}>{item.email}</Text>}
              </View>
              <Ionicons name="person-add" size={24} color="#2196F3" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 60
  },
  title: { 
    fontSize: 38,
    fontWeight: "bold", 
    color: "#2196F3", 
    textAlign: "center", 
    marginBottom: 20, 
    marginTop: 40,
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20
  },
  listContent: {
    paddingBottom: 20
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  userInfo: {
    marginLeft: 16,
    flex: 1
  },
  username: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212529'
  },
  email: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4
  },
  noResults: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 20,
    fontSize: 16
  }
});
