import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, Button } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BackButton from '../../components/BackButton';
import storage from '@react-native-firebase/storage';
import { Ionicons } from '@expo/vector-icons';

type Medicamento = {
  id: string;
  Nome_Med: string;
  imagemUrl?: string;
  createdAt?: any; // Firestore timestamp
};

type Filtro = 'recente' | 'antigo' | 'alfabetica';

export default function EliminarMedicamentoScreen() {
  const [loading, setLoading] = useState(true);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('recente');

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    const subscriber = firestore()
      .collection('Medicamentos')
      .where('uid', '==', user.uid)
      .onSnapshot(querySnapshot => {
        const meds: Medicamento[] = [];
        querySnapshot.forEach(documentSnapshot => {
          meds.push({
            id: documentSnapshot.id,
            ...(documentSnapshot.data() as Omit<Medicamento, 'id'>),
          });
        });
        setMedicamentos(meds);
        setLoading(false);
      });

    return () => subscriber();
  }, []);

  const eliminarMedicamento = (id: string, nome: string) => {
    Alert.alert(
      'Eliminar Medicamento',
      `Tens a certeza que queres eliminar "${nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(id);
            try {
              const doc = await firestore().collection('Medicamentos').doc(id).get();
              const data = doc.data();
              if (data?.imagemUrl) {
                const imageRef = storage().refFromURL(data.imagemUrl);
                await imageRef.delete();
              }
              await firestore().collection('Medicamentos').doc(id).delete();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível eliminar o medicamento.');
            } finally {
              setDeleting(null);
            }
          }
        }
      ]
    );
  };

  // Ordenação dos medicamentos conforme o filtro selecionado
  const getMedicamentosOrdenados = () => {
    let lista = [...medicamentos];
    if (filtro === 'recente') {
      lista.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
    } else if (filtro === 'antigo') {
      lista.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return aTime - bTime;
      });
    } else if (filtro === 'alfabetica') {
      lista.sort((a, b) => a.Nome_Med.localeCompare(b.Nome_Med));
    }
    return lista;
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Eliminar Medicamento</Text>

      <Text style={styles.label}>Filtros de Pesquisa:</Text>
      <View style={styles.filtros}>
        <Button
          title="Mais recente"
          color={filtro === 'recente' ? '#2196F3' : '#bbb'}
          onPress={() => setFiltro('recente')}
        />
        <Button
          title="Mais antigo"
          color={filtro === 'antigo' ? '#2196F3' : '#bbb'}
          onPress={() => setFiltro('antigo')}
        />
        <Button
          title="Alfabética"
          color={filtro === 'alfabetica' ? '#2196F3' : '#bbb'}
          onPress={() => setFiltro('alfabetica')}
        />
      </View>
      <FlatList
        data={getMedicamentosOrdenados()}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.item,
              deleting === item.id && styles.itemDeleting
            ]}
            onPress={() => eliminarMedicamento(item.id, item.Nome_Med)}
            disabled={deleting !== null}
            accessibilityRole="button"
          >
            <Text style={styles.nome}>{item.Nome_Med}</Text>
            <Ionicons name="trash" size={28} color="#F44336" style={{ marginLeft: 12 }} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum medicamento encontrado.</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  title: { fontSize: 38, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 10, marginTop: 40 },
  filtros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f9fa',
    borderRadius: 18,
    marginBottom: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDeleting: {
    backgroundColor: '#ffcccc',
  },
  nome: { fontSize: 28, fontWeight: 'bold', color: '#1565c0', textAlign: 'left', flex: 1 },
  empty: { textAlign: 'center', marginTop: 32, color: '#888', fontSize: 20 },
  label: {
    marginBottom: 6,
    fontWeight: 'bold',
    color: '#2196F3',
    fontSize: 20,
    textAlign: 'center'
  },
});