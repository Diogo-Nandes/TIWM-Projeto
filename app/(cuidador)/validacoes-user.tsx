import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import BackButton from '../../components/BackButton';
import DateTimePicker from '@react-native-community/datetimepicker';

interface MedicamentoFirestore {
  id: string;
  Nome_Med: string;
  Quantidade_mg: number;
  Horarios?: string[];
  uid: string;
  De?: any; // Timestamp
  Até?: any; // Timestamp
}

interface MedicamentoHorario {
  horario: string;
  medicamentos: {
    id: string;
    Nome_Med: string;
    Quantidade_mg: number;
    validado: boolean;
  }[];
}

interface RegistroToma {
  id: string;
  medicamentoId: string;
  horario: string;
  validado: boolean;
  data: any; // Timestamp
}

export default function ValidacoesUserScreen() {
  const [medicamentosAgrupados, setMedicamentosAgrupados] = useState<MedicamentoHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [uidAssociado, setUidAssociado] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const currentUser = auth().currentUser;

  // Busca o utilizador associado
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    const unsubscribe = firestore()
      .collection('Utilizadores')
      .where('uid', '==', currentUser.uid)
      .limit(1)
      .onSnapshot(querySnapshot => {
        if (!querySnapshot || !querySnapshot.docs) {
          setUidAssociado(null);
          setLoading(false);
          return;
        }
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
          setUidAssociado(data?.uidAssociado || null);
        } else {
          setUidAssociado(null);
        }
        setLoading(false);
      }, error => {
        setUidAssociado(null);
        setLoading(false);
        console.log('Erro no onSnapshot (user):', error);
      });

    return () => unsubscribe();
  }, [currentUser]);

  // Busca e agrupa medicamentos por horário e data
  useEffect(() => {
  if (!uidAssociado) {
    setMedicamentosAgrupados([]);
    return;
  }

  setLoading(true);

  const processarMedicamentos = async () => {
    try {
      // 1. Busca todos os medicamentos do associado
      const medicamentosSnapshot = await firestore()
        .collection('Medicamentos')
        .where('uid', '==', uidAssociado)
        .get();

      const medicamentos: MedicamentoFirestore[] = medicamentosSnapshot.docs.map(doc => {
        const data = doc.data() as Partial<Omit<MedicamentoFirestore, 'id'>>;
        return {
          id: doc.id,
          Nome_Med: data.Nome_Med ?? 'Medicamento sem nome',
          Quantidade_mg: data.Quantidade_mg ?? 0,
          Horarios: data.Horarios ?? [],
          uid: data.uid ?? '',
          De: data.De,
          Até: data.Até
        };
      });

      // 2. Busca registos de tomas
      const registosSnapshot = await firestore()
        .collection('RegistosTomas')
        .get();

      const registos: RegistroToma[] = registosSnapshot.docs.map(doc => {
        const data = doc.data() as Partial<RegistroToma>;
        return {
          id: doc.id,
          medicamentoId: data.medicamentoId ?? '',
          horario: data.horario ?? '',
          validado: data.validado ?? false,
          data: data.data ?? null
        };
      });

      // Log para debug
      console.log('Registos encontrados:', registos);
      console.log('Data selecionada:', date.toDateString());

      // 3. Filtra medicamentos válidos para a data selecionada
      const medicamentosFiltrados = medicamentos.filter(med => {
        const startDate = med.De?.toDate?.();
        const endDate = med.Até?.toDate?.();
        return (!startDate || date >= startDate) && (!endDate || date <= endDate);
      });

      // 4. Agrupa por horário
      const medicamentosMap = new Map<string, any[]>();

      medicamentosFiltrados.forEach(medicamento => {
        medicamento.Horarios?.forEach(horario => {
          // VERIFICAÇÃO CORRIGIDA
          const registo = registos.find(r => {
            if (!r.data || !r.data.toDate) return false;
            
            const registoDate = r.data.toDate();
            const isMesmaData = (
              registoDate.getDate() === date.getDate() &&
              registoDate.getMonth() === date.getMonth() &&
              registoDate.getFullYear() === date.getFullYear()
            );

            const isMedicamentoCorreto = r.medicamentoId === medicamento.id;
            const isHorarioCorreto = r.horario === horario;
            const isValidado = r.validado === true;

            console.log(`Verificando: ${medicamento.Nome_Med} às ${horario}`, {
              isMesmaData,
              isMedicamentoCorreto,
              isHorarioCorreto,
              isValidado,
              registoDate: registoDate.toDateString(),
              selectedDate: date.toDateString()
            });

            return isMesmaData && isMedicamentoCorreto && isHorarioCorreto && isValidado;
          });

          const medicamentoFormatado = {
            id: medicamento.id,
            Nome_Med: medicamento.Nome_Med || 'Medicamento sem nome',
            Quantidade_mg: medicamento.Quantidade_mg || 0,
            validado: !!registo // Só true se encontrar registo validado
          };

          if (!medicamentosMap.has(horario)) {
            medicamentosMap.set(horario, []);
          }
          medicamentosMap.get(horario)?.push(medicamentoFormatado);
        });
      });

      // 5. Ordena e atualiza o estado
      const medicamentosOrdenados = Array.from(medicamentosMap.entries())
        .map(([horario, medicamentos]) => ({
          horario,
          medicamentos
        }))
        .sort((a, b) => {
          const [horaA, minutoA] = a.horario.split(':').map(Number);
          const [horaB, minutoB] = b.horario.split(':').map(Number);
          return (horaA * 60 + minutoA) - (horaB * 60 + minutoB);
        });

      setMedicamentosAgrupados(medicamentosOrdenados);
      setLoading(false);
    } catch (error) {
      console.log('Erro ao processar dados:', error);
      setMedicamentosAgrupados([]);
      setLoading(false);
    }
  };

  processarMedicamentos();
}, [uidAssociado, date]);

  const renderHorarioItem = ({ item }: { item: MedicamentoHorario }) => (
    <View style={styles.horarioContainer}>
      <Text style={styles.horarioTitulo}>{item.horario}</Text>
      {item.medicamentos.map((medicamento, index) => (
        <View key={`${medicamento.id}-${index}`} style={styles.medicamentoItem}>
          <View style={styles.medicamentoInfo}>
            <Text style={styles.nomeMedicamento}>{medicamento.Nome_Med}</Text>
            <Text style={styles.quantidadeMedicamento}>{medicamento.Quantidade_mg}mg</Text>
          </View>
          {medicamento.validado && (
            <Ionicons 
              name="checkmark-circle" 
              size={24} 
              color="#4CAF50" 
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <BackButton />
      <Text style={styles.title}>Validações de Medicamentos</Text>
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
          data={medicamentosAgrupados}
          keyExtractor={item => item.horario}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.noResults}>Nenhum medicamento encontrado</Text>
          }
          renderItem={renderHorarioItem}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20
  },
  horarioContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  horarioTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
    textAlign: 'center'
  },
  medicamentoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  medicamentoInfo: {
    flex: 1,
    marginRight: 16
  },
  nomeMedicamento: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529'
  },
  quantidadeMedicamento: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2
  },
  noResults: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 20,
    fontSize: 16
  }
});
