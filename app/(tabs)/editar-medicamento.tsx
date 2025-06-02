import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, Button } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import BackButton from '../../components/BackButton';
import { useRouter } from 'expo-router';

type Medicamento = {
  id: string;
  Nome_Med: string;
  createdAt?: any; // Firestore timestamp
};

type Filtro = 'recente' | 'antigo' | 'alfabetica';

export default function EditarMedicamentoScreen() {
  const [loading, setLoading] = useState(true);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('recente');
  const router = useRouter();

  useEffect(() => {
    const user = auth().currentUser;
    if (!user) {
      setMedicamentos([]);
      setLoading(false);
      return;
    }

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
      <Text style={styles.title}>Editar Medicamento</Text>
      
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
            style={styles.item}
            onPress={() => router.push({ pathname: '/editar-medicamento-detalhe', params: { id: item.id } })}
          >
            <Text style={styles.nome}>{item.Nome_Med}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum medicamento encontrado.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 10, marginTop: 40 },
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
    alignItems: 'center'
  },
  nome: { fontSize: 18, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 32, color: '#888' },
  label: {
    marginBottom: 6,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});
