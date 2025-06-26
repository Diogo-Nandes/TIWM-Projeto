import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
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

type HorarioGrupo = {
  hora: string;
  medicamentos: Medicamento[];
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

  const getHorariosAgrupados = () => {
    const medicamentosFiltrados = medicamentos.filter(med => 
      med.Horarios && med.Horarios.length > 0 && isDateInRange(med)
    );

    const horasUnicas = Array.from(
      new Set(
        medicamentosFiltrados
          .flatMap(med => med.Horarios || [])
          .sort((a, b) => {
            const [aH, aM] = a.split(':').map(Number);
            const [bH, bM] = b.split(':').map(Number);
            return aH - bH || aM - bM;
          })
      )
    );

    return horasUnicas.map(hora => ({
      hora,
      medicamentos: medicamentosFiltrados.filter(med => 
        med.Horarios?.includes(hora)
      )
    }));
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Horário de Toma</Text>
      
      <Text style={styles.dateText}>
        Data selecionada: {date.toLocaleDateString('pt-PT')}
      </Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowDatePicker(true)}
        accessibilityLabel="Escolher data"
      >
        <Text style={styles.buttonText}>Escolher Data</Text>
      </TouchableOpacity>

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
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={getHorariosAgrupados()}
          keyExtractor={item => item.hora}
          renderItem={({ item }) => (
            <View style={styles.horarioGroup}>
              <Text style={styles.horaHeader}>{item.hora}</Text>
              {item.medicamentos.map(med => (
                <View key={med.id} style={styles.medicamentoItem}>
                  <Text style={styles.medicamentoNome}>{med.Nome_Med}</Text>
                </View>
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              Nenhum medicamento agendado para esta data.
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
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
  dateText: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  horarioGroup: {
    marginBottom: 25,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
  },
  horaHeader: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e3e3e3',
    paddingBottom: 8,
    textAlign: 'left',
  },
  medicamentoItem: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  medicamentoNome: {
    fontSize: 22,
    color: '#2196F3',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
    fontSize: 20,
    paddingHorizontal: 20,
  },
});
