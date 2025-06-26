import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useLocalSearchParams } from 'expo-router';
import BackButton from '../../components/BackButton';
import { Ionicons } from '@expo/vector-icons';

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
      <View style={styles.imageSection}>
        {med.imagemUrl ? (
          <Image source={{ uri: med.imagemUrl }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.placeholderContent}>
              <Ionicons name="image-outline" size={56} color="#bbb" />
              <Text style={styles.placeholderText}>Sem imagem</Text>
            </View>
          </View>
        )}
      </View>
      <Text style={styles.label}>Quantidade: <Text style={styles.value}>{med.Quantidade_mg} mg</Text></Text>
      <Text style={styles.label}>De: <Text style={styles.value}>{med.De && typeof med.De.toDate === 'function' ? med.De.toDate().toLocaleDateString() : ''}</Text></Text>
      <Text style={styles.label}>Até: <Text style={styles.value}>{med.Até && typeof med.Até.toDate === 'function' ? med.Até.toDate().toLocaleDateString() : ''}</Text></Text>
      {med.Horarios && med.Horarios.length > 0 && (
        <View style={styles.horariosBox}>
          <Text style={[styles.label, { alignSelf: 'center' }]}>Horários:</Text>
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
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60, alignItems: 'center' },
  title: { fontSize: 38, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 20, marginTop: 40 },
  imageSection: { alignItems: 'center', marginTop: 10, marginBottom: 8 },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 16,
    resizeMode: 'cover',
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 16,
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
    fontSize: 20, 
    marginTop: 8, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  label: { fontWeight: 'bold', color: '#2196F3', marginTop: 16, fontSize: 22, textAlign: 'center' },
  value: { color: '#222', fontWeight: 'normal', fontSize: 22 },
  horariosBox: { marginTop: 16, width: '100%', alignItems: 'center' },
  horariosLista: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },
  horarioItem: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 12,
    marginBottom: 8,
    fontSize: 22,
    textAlign: 'center',
  },
});
