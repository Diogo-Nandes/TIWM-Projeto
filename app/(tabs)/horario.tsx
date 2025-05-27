import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import BackButton from '../../components/BackButton';

type Medicamento = {
  id: string;
  Nome_Med: string;
  Horarios?: string[];
  De?: { toDate: () => Date };
  Até?: { toDate: () => Date };
};

export default function HorarioScreen() {
  const [date, setDate] = useState(new Date());
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
            ...(documentSnapshot.data() as Omit<Medicamento, 'id'>),
            id: documentSnapshot.id,
          });
        });
        setMedicamentos(meds);
        setLoading(false);
      });

    return () => subscriber();
  }, []);

  const isDateInRange = (med: Medicamento) => {
    const startDate = med.De?.toDate();
    const endDate = med.Até?.toDate();
    return startDate && endDate && date >= startDate && date <= endDate;
  };

  const medicamentosFiltrados = medicamentos.filter(med => 
    med.Horarios && med.Horarios.length > 0 && isDateInRange(med)
  );

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Horário de Toma</Text>
      
      <Text style={styles.dateText}>
        Data selecionada: {date.toLocaleDateString('pt-PT')}
      </Text>
      
      <Button
        title="Escolher Data"
        onPress={() => setShowDatePicker(true)}
        color="#2196F3"
      />

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={medicamentosFiltrados}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.medicamentoItem}>
              <Text style={styles.medicamentoNome}>{item.Nome_Med}</Text>
              <View style={styles.horariosContainer}>
                {item.Horarios?.map((hora, index) => (
                  <Text key={index} style={styles.horarioText}>{hora}</Text>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nenhum medicamento agendado para esta data.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: "bold", color: "#2196F3", textAlign: "center", marginBottom: 10, marginTop: 40 },
  dateText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    color: '#555',
  },
  medicamentoItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  medicamentoNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  horariosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horarioText: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#888',
    fontSize: 16,
  },
});
