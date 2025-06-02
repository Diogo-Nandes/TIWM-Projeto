import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import BackButton from '../../components/BackButton';

type Medicamento = {
  Nome_Med: string;
  Quantidade_mg: number;
  De?: { toDate: () => Date };
  Até?: { toDate: () => Date };
  Horarios?: string[];
  imagemUrl?: string;
};

export default function VisualizarMedicamentoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [med, setMed] = useState<Medicamento | null>(null);

  useEffect(() => {
    if (!id) return;
    firestore().collection('Medicamentos').doc(id).get().then(doc => {
      if (doc.exists()) setMed(doc.data() as Medicamento);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  if (!med) {
    return (
      <View style={styles.container}>
        <BackButton />
        <Text style={styles.title}>Medicamento não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <BackButton />
      <Text style={styles.title}>{med.Nome_Med}</Text>
      {med.imagemUrl && (
        <Image source={{ uri: med.imagemUrl }} style={styles.image} />
      )}
      <Text style={styles.label}>Quantidade: <Text style={styles.value}>{med.Quantidade_mg} mg</Text></Text>
      <Text style={styles.label}>De: <Text style={styles.value}>{med.De && typeof med.De.toDate === 'function' ? med.De.toDate().toLocaleDateString() : ''}</Text></Text>
      <Text style={styles.label}>Até: <Text style={styles.value}>{med.Até && typeof med.Até.toDate === 'function' ? med.Até.toDate().toLocaleDateString() : ''}</Text></Text>
      {med.Horarios && med.Horarios.length > 0 && (
        <View style={styles.horariosBox}>
          <Text style={styles.label}>Horários:</Text>
          <View style={styles.horariosLista}>
            {med.Horarios.map((hora, idx) => (
              <Text key={idx} style={styles.horarioItem}>{hora}</Text>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 10, marginTop: 40 },
  image: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 8,
  },
  label: { fontWeight: 'bold', color: '#2196F3', marginTop: 10, fontSize: 16 },
  value: { color: '#222', fontWeight: 'normal' },
  horariosBox: { marginTop: 10, width: '100%', alignItems: 'center' },
  horariosLista: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 },
  horarioItem: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
    marginBottom: 4,
    fontSize: 15,
    textAlign: 'center',
  },
});