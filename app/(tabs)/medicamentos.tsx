import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import BackButton from '../../components/BackButton';
import auth from '@react-native-firebase/auth';

type Medicamento = {
  id: string;
  Nome_Med: string;
  Quantidade_mg: number;
  De?: { toDate: () => Date };
  Até?: { toDate: () => Date };
  Horarios?: string[];
};

export default function MedicamentosScreen() {
  const [loading, setLoading] = useState(true);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

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

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Medicamentos</Text>
      <FlatList
        data={medicamentos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.nome}>{item.Nome_Med}</Text>
            <Text>Quantidade: {item.Quantidade_mg} mg</Text>
            <Text>
              De: {item.De && typeof item.De.toDate === 'function'
                ? item.De.toDate().toLocaleDateString()
                : ''}
            </Text>
            <Text>
              Até: {item.Até && typeof item.Até.toDate === 'function'
                ? item.Até.toDate().toLocaleDateString()
                : ''}
            </Text>
            {item.Horarios && item.Horarios.length > 0 && (
              <View style={styles.horariosBox}>
                <Text style={styles.horariosTitulo}>Horários:</Text>
                <View style={styles.horariosLista}>
                  {item.Horarios.map((hora, idx) => (
                    <Text key={idx} style={styles.horarioItem}>{hora}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum medicamento encontrado.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 10, marginTop: 40 },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  nome: { fontSize: 18, fontWeight: 'bold' },
  horariosBox: { marginTop: 8 },
  horariosTitulo: { fontWeight: 'bold', color: '#2196F3', marginBottom: 2 },
  horariosLista: { flexDirection: 'row', flexWrap: 'wrap' },
  horarioItem: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 15,
  },
  empty: { textAlign: 'center', marginTop: 32, color: '#888' },
});
