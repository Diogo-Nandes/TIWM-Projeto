import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import BackButton from '../../components/BackButton';

type Medicamento = {
  id: string;
  Nome_Med: string;
};

export default function EliminarMedicamentoScreen() {
  const [loading, setLoading] = useState(true);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const subscriber = firestore()
      .collection('Medicamentos')
      .onSnapshot(querySnapshot => {
        const meds: Medicamento[] = [];
        querySnapshot.forEach(documentSnapshot => {
          meds.push({
            id: documentSnapshot.id,
            Nome_Med: documentSnapshot.get('Nome_Med'),
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

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Eliminar Medicamento</Text>
      <FlatList
        data={medicamentos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.item,
              deleting === item.id && styles.itemDeleting
            ]}
            onPress={() => eliminarMedicamento(item.id, item.Nome_Med)}
            disabled={deleting !== null}
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
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
    marginBottom: 4,
    borderRadius: 8,
  },
  itemDeleting: { backgroundColor: '#ffcccc' },
  nome: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  empty: { textAlign: 'center', marginTop: 32, color: '#888' },
});
